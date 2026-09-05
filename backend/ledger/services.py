"""
Ledger service layer — all financial operations go through here.

Rules enforced:
1. Amounts must be positive.
2. Transaction type determines financial direction.
3. Financial operations are atomic (db.transaction.atomic).
4. Transactions are never deleted — corrections create reversal records.
5. Balance is calculated from transaction aggregation only.
"""
from decimal import Decimal
from django.db import transaction as db_transaction
from django.db.models import Sum, Q

from .models import Transaction, TransactionType


def calculate_balance(customer):
    """
    Authoritative balance calculation.
    Balance = SUM(CREDIT) - SUM(PAYMENT)
    REVERSAL transactions cancel themselves via type=REVERSAL
    which counter-acts the original direction.
    """
    agg = customer.transactions.aggregate(
        total_credit=Sum(
            "amount",
            filter=Q(type=TransactionType.CREDIT)
        ),
        total_payment=Sum(
            "amount",
            filter=Q(type=TransactionType.PAYMENT)
        ),
        total_reversal_credit=Sum(
            "amount",
            filter=Q(type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)
        ),
        total_reversal_payment=Sum(
            "amount",
            filter=Q(type=TransactionType.REVERSAL, reversal_of__type=TransactionType.PAYMENT)
        ),
    )

    total_credit = (agg["total_credit"] or Decimal("0")) - (agg["total_reversal_credit"] or Decimal("0"))
    total_payment = (agg["total_payment"] or Decimal("0")) - (agg["total_reversal_payment"] or Decimal("0"))

    return total_credit - total_payment


@db_transaction.atomic
def create_transaction(customer, transaction_type, amount, description, transaction_date, created_by, quantity=""):
    """
    Create a validated transaction record.
    Raises ValueError for invalid input.
    Returns the created Transaction instance.
    """
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Amount must be greater than ₹0.")

    if transaction_type not in [TransactionType.CREDIT, TransactionType.PAYMENT]:
        raise ValueError(f"Invalid transaction type: {transaction_type}")

    txn = Transaction.objects.create(
        customer=customer,
        type=transaction_type,
        amount=amount,
        description=description or "",
        quantity=quantity or "",
        transaction_date=transaction_date,
        created_by=created_by,
    )
    return txn


@db_transaction.atomic
def reverse_transaction(original_transaction, created_by):
    """
    Create an audit-safe reversal record for a transaction.
    The original transaction is preserved in history.
    Returns the new reversal Transaction.
    """
    if original_transaction.type == TransactionType.REVERSAL:
        raise ValueError("Cannot reverse a reversal transaction.")

    if original_transaction.reversals.exists():
        raise ValueError("This transaction has already been reversed.")

    reversal = Transaction.objects.create(
        customer=original_transaction.customer,
        type=TransactionType.REVERSAL,
        amount=original_transaction.amount,
        description=f"Reversal of: {original_transaction.description or original_transaction.type}",
        transaction_date=original_transaction.transaction_date,
        created_by=created_by,
        reversal_of=original_transaction,
    )
    return reversal
