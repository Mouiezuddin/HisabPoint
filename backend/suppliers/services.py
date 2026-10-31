"""Supplier service layer — authoritative payables calculation and operations."""
import datetime
from decimal import Decimal
from django.db import transaction as db_transaction
from django.db.models import Sum, Q, Value, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone

from .models import Supplier, SupplierTransaction, SupplierTransactionType


def calculate_supplier_balance(supplier):
    """
    Authoritative balance calculation for a supplier.
    Balance = Net Purchases - Net Payments
    Positive (> 0): Merchant owes supplier (Dena Hai / Payable).
    Negative (< 0): Merchant has paid advance to supplier.
    Zero (= 0): Settled / All dues cleared.
    """
    agg = supplier.transactions.aggregate(
        total_purchase=Sum("amount", filter=Q(type=SupplierTransactionType.PURCHASE)),
        total_payment=Sum("amount", filter=Q(type=SupplierTransactionType.PAYMENT)),
        total_reversal_purchase=Sum(
            "amount",
            filter=Q(
                type=SupplierTransactionType.REVERSAL,
                reversal_of__type=SupplierTransactionType.PURCHASE,
            ),
        ),
        total_reversal_payment=Sum(
            "amount",
            filter=Q(
                type=SupplierTransactionType.REVERSAL,
                reversal_of__type=SupplierTransactionType.PAYMENT,
            ),
        ),
    )

    total_purchase = (agg["total_purchase"] or Decimal("0")) - (
        agg["total_reversal_purchase"] or Decimal("0")
    )
    total_payment = (agg["total_payment"] or Decimal("0")) - (
        agg["total_reversal_payment"] or Decimal("0")
    )

    return total_purchase - total_payment


def get_supplier_balance_status(balance):
    """Return status string for supplier balance."""
    if balance > Decimal("0.00"):
        return "due"
    elif balance < Decimal("0.00"):
        return "advance"
    return "settled"


def get_supplier_for_user(supplier_id, user):
    """Retrieve a supplier by ID, ensuring user ownership."""
    return Supplier.objects.get(id=supplier_id, user=user)


def annotate_supplier_balance(queryset):
    """
    Annotate supplier queryset with `_balance` using a single SQL query aggregation.
    Balance = Net Purchases - Net Payments
    """
    output_field = DecimalField(max_digits=12, decimal_places=2)
    zero = Value(Decimal("0.00"), output_field=output_field)

    purchase = Coalesce(
        Sum(
            "transactions__amount",
            filter=Q(transactions__type=SupplierTransactionType.PURCHASE),
        ),
        zero,
        output_field=output_field,
    )
    payment = Coalesce(
        Sum(
            "transactions__amount",
            filter=Q(transactions__type=SupplierTransactionType.PAYMENT),
        ),
        zero,
        output_field=output_field,
    )
    rev_purchase = Coalesce(
        Sum(
            "transactions__amount",
            filter=Q(
                transactions__type=SupplierTransactionType.REVERSAL,
                transactions__reversal_of__type=SupplierTransactionType.PURCHASE,
            ),
        ),
        zero,
        output_field=output_field,
    )
    rev_payment = Coalesce(
        Sum(
            "transactions__amount",
            filter=Q(
                transactions__type=SupplierTransactionType.REVERSAL,
                transactions__reversal_of__type=SupplierTransactionType.PAYMENT,
            ),
        ),
        zero,
        output_field=output_field,
    )

    return queryset.annotate(
        _balance=Coalesce(
            (purchase - rev_purchase) - (payment - rev_payment),
            zero,
            output_field=output_field,
        )
    )


@db_transaction.atomic
def create_supplier_transaction(
    supplier,
    transaction_type,
    amount,
    bill_number="",
    description="",
    transaction_date=None,
    created_by=None,
    transaction_time=None,
):
    """Create a validated supplier transaction record."""
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Amount must be greater than ₹0.")

    if transaction_type not in [
        SupplierTransactionType.PURCHASE,
        SupplierTransactionType.PAYMENT,
    ]:
        raise ValueError(f"Invalid supplier transaction type: {transaction_type}")

    if not transaction_date:
        transaction_date = timezone.localdate()

    txn = SupplierTransaction.objects.create(
        supplier=supplier,
        type=transaction_type,
        amount=amount,
        bill_number=bill_number or "",
        description=description or "",
        transaction_date=transaction_date,
        created_by=created_by,
    )

    if transaction_time:
        t_obj = None
        if isinstance(transaction_time, str) and transaction_time.strip():
            try:
                parts = [int(p) for p in transaction_time.strip().split(":")[:3]]
                t_obj = datetime.time(*parts)
            except Exception:
                t_obj = None
        elif isinstance(transaction_time, datetime.time):
            t_obj = transaction_time

        if t_obj:
            dt = datetime.datetime.combine(transaction_date, t_obj)
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt)
            SupplierTransaction.objects.filter(id=txn.id).update(created_at=dt)
            txn.refresh_from_db()

    return txn


@db_transaction.atomic
def reverse_supplier_transaction(original_transaction, created_by):
    """Create an audit-safe reversal record for a supplier transaction."""
    if original_transaction.type == SupplierTransactionType.REVERSAL:
        raise ValueError("Cannot reverse a reversal transaction.")

    if original_transaction.reversals.exists():
        raise ValueError("This transaction has already been reversed.")

    reversal = SupplierTransaction.objects.create(
        supplier=original_transaction.supplier,
        type=SupplierTransactionType.REVERSAL,
        amount=original_transaction.amount,
        bill_number=original_transaction.bill_number,
        description=f"Reversal of: {original_transaction.description or original_transaction.type}",
        transaction_date=original_transaction.transaction_date,
        created_by=created_by,
        reversal_of=original_transaction,
    )
    return reversal
