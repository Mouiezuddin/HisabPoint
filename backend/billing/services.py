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


def get_next_invoice_number(user):
    """
    Derive the next sequential invoice number for a user.
    Format: INV-0001, INV-0002, ...
    """
    last_invoice = (
        Invoice.objects
        .filter(user=user)
        .aggregate(max_num=Max("invoice_number"))
    )
    last_num = last_invoice["max_num"]
    if last_num and last_num.startswith("INV-"):
        try:
            seq = int(last_num.split("-")[1]) + 1
        except (ValueError, IndexError):
            seq = 1
    else:
        seq = 1
    return f"INV-{seq:04d}"


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
):
    """
    Create an invoice with items, compute totals, and optionally book a ledger transaction.

    Args:
        user: Authenticated user (shopkeeper).
        customer: Optional Customer model instance (for linked customers).
        customer_name: Display name for walk-in or snapshot.
        customer_phone: Display phone for walk-in or snapshot.
        invoice_number: Explicit number or auto-generated.
        invoice_date: Date of the invoice.
        payment_status: One of InvoiceStatus choices.
        payment_mode: One of PaymentMode choices.
        discount_type: 'flat' or 'percentage'.
        discount_value: Discount input value.
        tax_rate: GST/tax rate as percentage (e.g., 18.00).
        paid_amount: Amount already paid.
        notes: Additional notes.
        terms: Terms and conditions text.
        items: List of dicts with keys: name, quantity, unit, unit_price.

    Returns:
        The created Invoice instance.
    """
    if not items or len(items) == 0:
        raise ValueError("At least one item is required.")

    if invoice_number is None:
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
        qty = _quantize(item_data.get("quantity", 1))
        price = _quantize(item_data.get("unit_price", 0))
        if qty <= 0:
            raise ValueError(f"Item '{item_data.get('name', '')}' quantity must be greater than 0.")
        if price <= 0:
            raise ValueError(f"Item '{item_data.get('name', '')}' price must be greater than ₹0.")

        line_amount = _quantize(qty * price)
        subtotal += line_amount

        item_objects.append({
            "name": item_data.get("name", "Item"),
            "quantity": qty,
            "unit": item_data.get("unit", "pcs"),
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

    # Auto-determine payment status based on paid amount
    if paid_amount >= total_amount:
        payment_status = InvoiceStatus.PAID
    elif paid_amount > 0:
        payment_status = InvoiceStatus.PARTIALLY_PAID
    # else keep the provided status (default UNPAID)

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
        notes=notes,
        terms=terms,
    )

    # Create invoice items
    InvoiceItem.objects.bulk_create([
        InvoiceItem(invoice=invoice, **item_data)
        for item_data in item_objects
    ])

    # If invoice is credit/unpaid for a linked customer, create ledger transaction
    balance_due = total_amount - paid_amount
    if customer and balance_due > 0 and payment_status != InvoiceStatus.PAID:
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
