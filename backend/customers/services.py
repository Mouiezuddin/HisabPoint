"""Customer service functions — balance is computed here."""
from decimal import Decimal
from django.db.models import Sum, Q
from .models import Customer


def get_customer_balance(customer):
    """
    Compute outstanding balance from transactions.
    Balance = (Total CREDIT - Total REVERSAL CREDIT) - (Total PAYMENT - Total REVERSAL PAYMENT)
    Returns a Decimal.
    """
    from ledger.models import Transaction, TransactionType

    agg = customer.transactions.aggregate(
        total_credit=Sum("amount", filter=Q(type=TransactionType.CREDIT)),
        total_payment=Sum("amount", filter=Q(type=TransactionType.PAYMENT)),
        total_reversal_credit=Sum("amount", filter=Q(type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)),
        total_reversal_payment=Sum("amount", filter=Q(type=TransactionType.REVERSAL, reversal_of__type=TransactionType.PAYMENT)),
    )
    total_credit = (agg["total_credit"] or Decimal("0")) - (agg["total_reversal_credit"] or Decimal("0"))
    total_payment = (agg["total_payment"] or Decimal("0")) - (agg["total_reversal_payment"] or Decimal("0"))
    return total_credit - total_payment


def get_balance_status(balance):
    """Return a string status label based on the balance."""
    if balance > 0:
        return "due"
    elif balance < 0:
        return "advance"
    return "settled"


def get_customer_for_user(customer_id, user):
    """
    Retrieve a customer by ID, ensuring it belongs to the requesting user.
    Raises Customer.DoesNotExist if not found or unauthorized.
    """
    return Customer.objects.get(id=customer_id, user=user)


def annotate_customer_balance(queryset):
    """
    Annotate queryset with `_balance` using a single SQL query aggregation.
    Balance = (Total CREDIT - Total REVERSAL CREDIT) - (Total PAYMENT - Total REVERSAL PAYMENT)
    """
    from decimal import Decimal
    from django.db.models import Sum, Q, Value, DecimalField
    from django.db.models.functions import Coalesce
    from ledger.models import TransactionType

    output_field = DecimalField(max_digits=12, decimal_places=2)
    zero = Value(Decimal("0.00"), output_field=output_field)

    credit = Coalesce(Sum("transactions__amount", filter=Q(transactions__type=TransactionType.CREDIT)), zero, output_field=output_field)
    payment = Coalesce(Sum("transactions__amount", filter=Q(transactions__type=TransactionType.PAYMENT)), zero, output_field=output_field)
    rev_credit = Coalesce(Sum("transactions__amount", filter=Q(transactions__type=TransactionType.REVERSAL, transactions__reversal_of__type=TransactionType.CREDIT)), zero, output_field=output_field)
    rev_payment = Coalesce(Sum("transactions__amount", filter=Q(transactions__type=TransactionType.REVERSAL, transactions__reversal_of__type=TransactionType.PAYMENT)), zero, output_field=output_field)

    return queryset.annotate(
        _balance=(credit - rev_credit) - (payment - rev_payment)
    )

