"""
Billing service layer — invoice creation, cancellation, and ledger integration.

Rules enforced:
1. Invoice items must have valid quantities and prices.
2. Financial calculations (subtotal, discount, tax, total) are server-authoritative.
3. Credit invoices atomically create ledger transactions.
4. Invoice cancellation atomically reverses linked ledger transactions.
5. Invoice numbers are sequential per user.
"""
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction as db_transaction
from django.db.models import Max

from .models import Invoice, InvoiceItem, InvoiceStatus, PaymentMode
from ledger.models import TransactionType
from ledger.services import create_transaction, reverse_transaction


def get_next_invoice_number(user, prefix="RP-"):
    """
    Derive the next sequential invoice number for a user.
    Format: RP-000001, RP-000002, ... (preserves INV- series if already in use).
    """
    invoices = Invoice.objects.filter(user=user).values_list("invoice_number", flat=True)
    max_seq = 0
    detected_prefix = prefix
    for num in invoices:
        if not num:
            continue
        for p in ("RP-", "INV-"):
            if num.startswith(p):
                try:
                    seq = int(num[len(p):])
                    if seq > max_seq:
                        max_seq = seq
                        detected_prefix = p
                except (ValueError, IndexError):
                    pass

    next_seq = max_seq + 1
    if detected_prefix == "INV-":
        return f"INV-{next_seq:04d}"
    return f"RP-{next_seq:06d}"


def _quantize(value):
    """Round to 2 decimal places."""
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@db_transaction.atomic
def create_invoice(
    user,
    customer=None,
    customer_name="",
    customer_phone="",
    invoice_number=None,
    invoice_date=None,
    due_date=None,
    payment_status=InvoiceStatus.UNPAID,
    payment_mode=PaymentMode.CASH,
    discount_type="flat",
    discount_value=Decimal("0.00"),
    tax_rate=Decimal("0.00"),
    paid_amount=Decimal("0.00"),
    notes="",
    terms="Goods once sold will not be taken back.",
    items=None,
    ledger_transaction=None,
    billing_period_start=None,
    billing_period_end=None,
):
    """
    Create an invoice with items, compute totals, and optionally book a ledger transaction.
    """
    if not items or len(items) == 0:
        raise ValueError("At least one item is required.")

    if not invoice_number:
        invoice_number = get_next_invoice_number(user)

    # Use customer info as snapshot if customer is linked
    if customer:
        customer_name = customer_name or customer.name
        customer_phone = customer_phone or customer.phone

    if not customer_name:
        raise ValueError("Customer name is required.")

    # Calculate item amounts and subtotal
    subtotal = Decimal("0.00")
    item_objects = []
    for idx, item_data in enumerate(items):
        name = (item_data.get("name") or "").strip()
        if not name:
            raise ValueError(f"Item #{idx + 1} name is required.")

        qty_raw = item_data.get("quantity")
        price_raw = item_data.get("unit_price")
        amount_raw = item_data.get("amount")

        # If both qty and unit_price are provided:
        if qty_raw is not None and price_raw is not None and str(qty_raw) != "" and str(price_raw) != "":
            qty = _quantize(qty_raw)
            price = _quantize(price_raw)
            if qty <= 0:
                raise ValueError(f"Item '{name}' quantity must be greater than 0.")
            if price <= 0:
                raise ValueError(f"Item '{name}' price must be greater than ₹0.")
            line_amount = _quantize(qty * price)
            unit = item_data.get("unit") or "pcs"
        elif amount_raw is not None and str(amount_raw) != "":
            # Backward compatibility for legacy transactions without inventing fake qty/unit_price
            line_amount = _quantize(amount_raw)
            if line_amount <= 0:
                raise ValueError(f"Item '{name}' amount must be greater than ₹0.")
            qty = None
            price = None
            unit = item_data.get("unit") or ""
        elif price_raw is not None and str(price_raw) != "":
            line_amount = _quantize(price_raw)
            if line_amount <= 0:
                raise ValueError(f"Item '{name}' amount must be greater than ₹0.")
            qty = None
            price = None
            unit = item_data.get("unit") or ""
        else:
            raise ValueError(f"Item '{name}' must have unit price or amount.")

        subtotal += line_amount

        item_objects.append({
            "name": name,
            "quantity": qty,
            "unit": unit,
            "unit_price": price,
            "amount": line_amount,
            "order": idx,
        })

    # Calculate discount
    discount_value = _quantize(discount_value)
    if discount_type == "percentage":
        if discount_value < 0 or discount_value > 100:
            raise ValueError("Discount percentage must be between 0 and 100.")
        discount_amount = _quantize(subtotal * discount_value / 100)
    else:
        if discount_value < 0:
            raise ValueError("Discount amount cannot be negative.")
        if discount_value > subtotal:
            raise ValueError("Discount cannot exceed the subtotal.")
        discount_amount = discount_value

    after_discount = subtotal - discount_amount

    # Calculate tax
    tax_rate = _quantize(tax_rate)
    if tax_rate < 0:
        raise ValueError("Tax rate cannot be negative.")
    tax_amount = _quantize(after_discount * tax_rate / 100)

    total_amount = _quantize(after_discount + tax_amount)

    # Validate paid amount
    paid_amount = _quantize(paid_amount)
    if paid_amount < 0:
        raise ValueError("Paid amount cannot be negative.")
    if paid_amount > total_amount:
        raise ValueError("Paid amount cannot exceed total amount.")

    # Auto-determine payment status based on actual payment data
    if paid_amount >= total_amount:
        payment_status = InvoiceStatus.PAID
    elif paid_amount > 0:
        payment_status = InvoiceStatus.PARTIALLY_PAID
    else:
        payment_status = InvoiceStatus.UNPAID

    # Create the invoice
    invoice = Invoice.objects.create(
        user=user,
        customer=customer,
        customer_name=customer_name,
        customer_phone=customer_phone,
        invoice_number=invoice_number,
        invoice_date=invoice_date,
        due_date=due_date,
        payment_status=payment_status,
        payment_mode=payment_mode,
        subtotal=subtotal,
        discount_type=discount_type,
        discount_value=discount_value,
        discount_amount=discount_amount,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        paid_amount=paid_amount,
        billing_period_start=billing_period_start,
        billing_period_end=billing_period_end,
        notes=notes,
        terms=terms,
    )

    # Create invoice items
    InvoiceItem.objects.bulk_create([
        InvoiceItem(invoice=invoice, **item_data)
        for item_data in item_objects
    ])

    # If invoice is linked to an existing transaction, or if credit/unpaid for a linked customer, book ledger transaction
    balance_due = total_amount - paid_amount
    if ledger_transaction:
        invoice.ledger_transaction = ledger_transaction
        invoice.save(update_fields=["ledger_transaction"])
    elif customer and balance_due > 0 and payment_status != InvoiceStatus.PAID:
        item_count = len(item_objects)
        description = f"Bill #{invoice_number} ({item_count} item{'s' if item_count != 1 else ''})"

        txn = create_transaction(
            customer=customer,
            transaction_type=TransactionType.CREDIT,
            amount=balance_due,
            description=description,
            transaction_date=invoice_date,
            created_by=user,
        )
        invoice.ledger_transaction = txn
        invoice.save(update_fields=["ledger_transaction"])

    return invoice


@db_transaction.atomic
def cancel_invoice(invoice, user):
    """
    Cancel an invoice and reverse any linked ledger transaction.

    Args:
        invoice: Invoice instance to cancel.
        user: The authenticated user performing cancellation.

    Returns:
        The updated Invoice instance.
    """
    if invoice.payment_status == InvoiceStatus.CANCELLED:
        raise ValueError("This invoice is already cancelled.")

    if invoice.user != user:
        raise ValueError("You do not have permission to cancel this invoice.")

    # Reverse linked ledger transaction if it exists
    if invoice.ledger_transaction:
        try:
            reverse_transaction(invoice.ledger_transaction, created_by=user)
        except ValueError:
            # Transaction may have already been reversed
            pass

    invoice.payment_status = InvoiceStatus.CANCELLED
    invoice.save(update_fields=["payment_status", "updated_at"])

    return invoice
