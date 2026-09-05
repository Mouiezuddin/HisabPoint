"""Admin API views — strictly restricted to staff/superuser via server-side permission class."""
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from common.permissions import IsAdminUser
from customers.models import Customer
from ledger.models import Transaction, TransactionType
from accounts.serializers import UserProfileSerializer

User = get_user_model()


class AdminUserListView(generics.ListAPIView):
    """
    GET /api/admin/users/ — list all registered shopkeepers (Admin only).
    """

    permission_classes = [IsAdminUser]
    serializer_class = UserProfileSerializer
    queryset = User.objects.all().order_by("-created_at")


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats_view(request):
    """
    GET /api/admin/stats/ — system-wide platform statistics (Admin only).
    """
    total_users = User.objects.count()
    total_customers = Customer.objects.count()
    total_transactions = Transaction.objects.count()

    total_volume = (
        Transaction.objects.aggregate(total=Sum("amount"))["total"] or 0
    )

    return Response(
        {
            "total_users": total_users,
            "total_customers": total_customers,
            "total_transactions": total_transactions,
            "total_volume": str(total_volume),
        }
    )
