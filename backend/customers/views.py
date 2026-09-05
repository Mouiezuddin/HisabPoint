"""Customer views — all queries filter by request.user."""
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Customer, CustomerStatus
from .serializers import CustomerSerializer, CustomerListSerializer
from .services import get_customer_for_user, annotate_customer_balance


class CustomerListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/customers/  — list own active customers (search supported)
    POST /api/customers/  — create new customer
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return CustomerListSerializer
        return CustomerSerializer

    def get_queryset(self):
        user = self.request.user
        include_archived = self.request.query_params.get("archived") == "true"

        if include_archived:
            qs = Customer.objects.filter(user=user)
        else:
            qs = Customer.objects.filter(user=user, status=CustomerStatus.ACTIVE)

        search = self.request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search) | Q(phone__icontains=search)
            )

        return annotate_customer_balance(qs).order_by("name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CustomerDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/customers/{id}/  — customer detail with balance
    PATCH /api/customers/{id}/  — update customer info
    """

    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            qs = annotate_customer_balance(Customer.objects.filter(user=self.request.user))
            return qs.get(pk=self.kwargs["pk"])
        except Customer.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Customer not found.")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def archive_customer_view(request, pk):
    """POST /api/customers/{id}/archive/ — soft-delete the customer."""
    try:
        customer = get_customer_for_user(pk, request.user)
    except Customer.DoesNotExist:
        return Response({"message": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

    customer.status = CustomerStatus.ARCHIVED
    customer.save(update_fields=["status", "updated_at"])
    return Response({"message": f"{customer.name} has been archived."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def restore_customer_view(request, pk):
    """POST /api/customers/{id}/restore/ — restore an archived customer."""
    try:
        customer = Customer.objects.get(id=pk, user=request.user)
    except Customer.DoesNotExist:
        return Response({"message": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

    customer.status = CustomerStatus.ACTIVE
    customer.save(update_fields=["status", "updated_at"])
    return Response({"message": f"{customer.name} has been restored."})
