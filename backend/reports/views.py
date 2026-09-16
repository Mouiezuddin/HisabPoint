"""Dashboard and report views."""
from decimal import Decimal
from datetime import timedelta

from django.db.models import Sum, Count, Max, Q, Value, DecimalField
from django.db.models.functions import Coalesce
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
    Returns full dashboard metrics matching Hisab UI design in 4-5 optimized queries.
    """
    user = request.user
    today = timezone.localdate()
    month_start = today.replace(day=1)

    output_field = DecimalField(max_digits=12, decimal_places=2)
    zero = Value(Decimal("0.00"), output_field=output_field)

    # Query 1: Total active customers count (lightweight, no joins)
    total_customers = Customer.objects.filter(user=user, status=CustomerStatus.ACTIVE).count()

    # Query 2: Single unified aggregation for all period metrics and totals
    agg = Transaction.objects.filter(
        customer__user=user,
        customer__status=CustomerStatus.ACTIVE,
    ).aggregate(
        today_given=Coalesce(Sum("amount", filter=Q(transaction_date=today, type=TransactionType.CREDIT)), zero)
                   - Coalesce(Sum("amount", filter=Q(transaction_date=today, type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)), zero),
        today_received=Coalesce(Sum("amount", filter=Q(transaction_date=today, type=TransactionType.PAYMENT)), zero)
                      - Coalesce(Sum("amount", filter=Q(transaction_date=today, type=TransactionType.REVERSAL, reversal_of__type=TransactionType.PAYMENT)), zero),

        month_sales=Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, type=TransactionType.CREDIT)), zero)
                   - Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)), zero),

        w1_sales=Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, transaction_date__day__gte=1, transaction_date__day__lte=7, type=TransactionType.CREDIT)), zero)
                - Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, transaction_date__day__gte=1, transaction_date__day__lte=7, type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)), zero),

        w2_sales=Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, transaction_date__day__gte=8, transaction_date__day__lte=14, type=TransactionType.CREDIT)), zero)
                - Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, transaction_date__day__gte=8, transaction_date__day__lte=14, type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)), zero),

        w3_sales=Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, transaction_date__day__gte=15, transaction_date__day__lte=21, type=TransactionType.CREDIT)), zero)
                - Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, transaction_date__day__gte=15, transaction_date__day__lte=21, type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)), zero),

        w4_sales=Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, transaction_date__day__gte=22, type=TransactionType.CREDIT)), zero)
                - Coalesce(Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, transaction_date__day__gte=22, type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)), zero),

        total_given=Coalesce(Sum("amount", filter=Q(type=TransactionType.CREDIT)), zero)
                   - Coalesce(Sum("amount", filter=Q(type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)), zero),
        total_received=Coalesce(Sum("amount", filter=Q(type=TransactionType.PAYMENT)), zero)
                      - Coalesce(Sum("amount", filter=Q(type=TransactionType.REVERSAL, reversal_of__type=TransactionType.PAYMENT)), zero),
        total_transactions=Count("id", filter=~Q(type=TransactionType.REVERSAL)),
    )

    # Query 3: Customers with due, balances and last transaction date (using values to avoid model instantiation overhead)
    active_customers = (
        annotate_customer_balance(Customer.objects.filter(user=user, status=CustomerStatus.ACTIVE))
        .annotate(last_txn_date=Max("transactions__transaction_date"))
        .values("id", "name", "phone", "_balance", "last_txn_date")
        .order_by("name")
    )

    customers_with_due = []
    total_due = Decimal("0")

    for customer in active_customers:
        balance = customer["_balance"]
        if balance > 0:
            total_due += balance
            last_txn_date = customer["last_txn_date"]
            if last_txn_date is None:
                last_txn_text = "No entries"
            elif last_txn_date == today:
                last_txn_text = "Today"
            elif last_txn_date == today - timedelta(days=1):
                last_txn_text = "Yesterday"
            else:
                last_txn_text = last_txn_date.strftime("%d %b")

            customers_with_due.append(
                {
                    "id": str(customer["id"]),
                    "name": customer["name"],
                    "phone": customer["phone"],
                    "balance": f"{balance:.2f}",
                    "last_transaction": last_txn_text,
                }
            )

    customers_with_due.sort(key=lambda c: Decimal(c["balance"]), reverse=True)

    # Query 4: Daily summary for last 7 days in a single grouped query
    seven_days_ago = today - timedelta(days=6)
    daily_txns = (
        Transaction.objects.filter(
            customer__user=user,
            customer__status=CustomerStatus.ACTIVE,
            transaction_date__gte=seven_days_ago,
            transaction_date__lte=today,
        )
        .values("transaction_date")
        .annotate(
            given=Coalesce(Sum("amount", filter=Q(type=TransactionType.CREDIT)), zero)
                  - Coalesce(Sum("amount", filter=Q(type=TransactionType.REVERSAL, reversal_of__type=TransactionType.CREDIT)), zero),
            received=Coalesce(Sum("amount", filter=Q(type=TransactionType.PAYMENT)), zero)
                     - Coalesce(Sum("amount", filter=Q(type=TransactionType.REVERSAL, reversal_of__type=TransactionType.PAYMENT)), zero),
        )
    )
    daily_map = {row["transaction_date"]: row for row in daily_txns}
    daily_summary = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        d = daily_map.get(day, {"given": Decimal("0"), "received": Decimal("0")})
        daily_summary.append({
            "date": day.strftime("%d %b"),
            "given": float(d["given"]),
            "received": float(d["received"]),
        })

    # Query 5: Recent transactions (top 6 for instant dashboard rendering)
    recent_txns_qs = (
        Transaction.objects.filter(
            customer__user=user,
            customer__status=CustomerStatus.ACTIVE,
        )
        .select_related("customer")
        .order_by("-transaction_date", "-created_at")[:6]
    )
    recent_transactions = [
        {
            "id": str(txn.id),
            "customer": str(txn.customer_id),
            "customer_name": txn.customer.name,
            "type": txn.type,
            "amount": f"{txn.amount:.2f}",
            "description": txn.description,
            "transaction_date": txn.transaction_date.isoformat(),
        }
        for txn in recent_txns_qs
    ]

    return Response(
        {
            "total_due": f"{total_due:.2f}",
            "today_given": f"{agg['today_given']:.2f}",
            "today_received": f"{agg['today_received']:.2f}",
            "total_customers": total_customers,
            "total_given": f"{agg['total_given']:.2f}",
            "total_received": f"{agg['total_received']:.2f}",
            "total_transactions": agg["total_transactions"],
            "daily_summary": daily_summary,
            "this_month_sales": f"{agg['month_sales']:.2f}",
            "weekly_breakdown": [
                {"week": "Week 1", "amount": f"{agg['w1_sales']:.2f}"},
                {"week": "Week 2", "amount": f"{agg['w2_sales']:.2f}"},
                {"week": "Week 3", "amount": f"{agg['w3_sales']:.2f}"},
                {"week": "Week 4", "amount": f"{agg['w4_sales']:.2f}"},
            ],
            "customers_with_due": customers_with_due[:20],
            "recent_transactions": recent_transactions,
        }
    )
