"""Dashboard and report views."""
from decimal import Decimal
from datetime import timedelta

from django.db.models import Sum, Max, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from customers.models import Customer, CustomerStatus
from ledger.models import Transaction, TransactionType
from customers.services import annotate_customer_balance


def calculate_net_amount(queryset, target_type):
    """
    Calculate net transaction sum for a specific type (CREDIT or PAYMENT),
    subtracting corresponding REVERSAL transactions in the queryset.
    """
    normal_sum = queryset.filter(type=target_type).aggregate(total=Sum("amount"))["total"] or Decimal("0")
    reversal_sum = queryset.filter(
        type=TransactionType.REVERSAL, reversal_of__type=target_type
    ).aggregate(total=Sum("amount"))["total"] or Decimal("0")
    return normal_sum - reversal_sum


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    """
    GET /api/dashboard/
    Returns full dashboard metrics matching Hisab UI design.
    """
    user = request.user
    today = timezone.localdate()

    # Today's transactions for this user
    today_txns = Transaction.objects.filter(
        customer__user=user,
        transaction_date=today,
        customer__status=CustomerStatus.ACTIVE,
    )

    today_given = calculate_net_amount(today_txns, TransactionType.CREDIT)
    today_received = calculate_net_amount(today_txns, TransactionType.PAYMENT)

    # Current month's transactions
    month_start = today.replace(day=1)
    month_txns = Transaction.objects.filter(
        customer__user=user,
        transaction_date__gte=month_start,
        transaction_date__lte=today,
        customer__status=CustomerStatus.ACTIVE,
    )

    this_month_sales = calculate_net_amount(month_txns, TransactionType.CREDIT)

    # Weekly breakdown for current month (Weeks 1 to 4)
    w1_txns = month_txns.filter(transaction_date__day__gte=1, transaction_date__day__lte=7)
    w2_txns = month_txns.filter(transaction_date__day__gte=8, transaction_date__day__lte=14)
    w3_txns = month_txns.filter(transaction_date__day__gte=15, transaction_date__day__lte=21)
    w4_txns = month_txns.filter(transaction_date__day__gte=22)

    week1_sales = calculate_net_amount(w1_txns, TransactionType.CREDIT)
    week2_sales = calculate_net_amount(w2_txns, TransactionType.CREDIT)
    week3_sales = calculate_net_amount(w3_txns, TransactionType.CREDIT)
    week4_sales = calculate_net_amount(w4_txns, TransactionType.CREDIT)

    # All active customers with annotated balances & last transaction date
    active_customers = annotate_customer_balance(
        Customer.objects.filter(user=user, status=CustomerStatus.ACTIVE)
    ).annotate(last_txn_date=Max("transactions__transaction_date"))

    total_customers = active_customers.count()

    customers_with_due = []
    total_due = Decimal("0")

    for customer in active_customers.order_by("name"):
        balance = customer._balance
        if balance > 0:
            total_due += balance
            if customer.last_txn_date is None:
                last_txn_text = "No entries"
            elif customer.last_txn_date == today:
                last_txn_text = "Today"
            elif customer.last_txn_date == today - timedelta(days=1):
                last_txn_text = "Yesterday"
            else:
                last_txn_text = customer.last_txn_date.strftime("%d %b")

            customers_with_due.append(
                {
                    "id": str(customer.id),
                    "name": customer.name,
                    "phone": customer.phone,
                    "balance": f"{balance:.2f}",
                    "last_transaction": last_txn_text,
                }
            )

    customers_with_due.sort(key=lambda c: Decimal(c["balance"]), reverse=True)

    # All transactions for this user
    all_txns = Transaction.objects.filter(
        customer__user=user,
        customer__status=CustomerStatus.ACTIVE,
    )
    total_given = calculate_net_amount(all_txns, TransactionType.CREDIT)
    total_received = calculate_net_amount(all_txns, TransactionType.PAYMENT)
    total_transactions = all_txns.exclude(type=TransactionType.REVERSAL).count()

    # Daily summary for the last 7 days
    daily_summary = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_txns = all_txns.filter(transaction_date=day)
        d_given = calculate_net_amount(day_txns, TransactionType.CREDIT)
        d_received = calculate_net_amount(day_txns, TransactionType.PAYMENT)
        daily_summary.append({
            "date": day.strftime("%d %b"),
            "given": float(d_given),
            "received": float(d_received),
        })

    return Response(
        {
            "total_due": f"{total_due:.2f}",
            "today_given": f"{today_given:.2f}",
            "today_received": f"{today_received:.2f}",
            "total_customers": total_customers,
            "total_given": f"{total_given:.2f}",
            "total_received": f"{total_received:.2f}",
            "total_transactions": total_transactions,
            "daily_summary": daily_summary,
            "this_month_sales": f"{this_month_sales:.2f}",
            "weekly_breakdown": [
                {"week": "Week 1", "amount": f"{week1_sales:.2f}"},
                {"week": "Week 2", "amount": f"{week2_sales:.2f}"},
                {"week": "Week 3", "amount": f"{week3_sales:.2f}"},
                {"week": "Week 4", "amount": f"{week4_sales:.2f}"},
            ],
            "customers_with_due": customers_with_due[:20],
        }
    )
