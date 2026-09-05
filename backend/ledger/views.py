"""Ledger views — transaction creation, history, and reversal."""
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from customers.models import Customer
from customers.services import get_customer_for_user
from .models import Transaction
from .serializers import TransactionSerializer, TransactionCreateSerializer
from .services import create_transaction, reverse_transaction, calculate_balance


class CustomerTransactionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/customers/{pk}/transactions/  — customer's transaction history
    POST /api/customers/{pk}/transactions/  — record a new transaction
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TransactionCreateSerializer
        return TransactionSerializer

    def get_customer(self):
        try:
            return get_customer_for_user(self.kwargs["pk"], self.request.user)
        except Customer.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Customer not found.")

    def get_queryset(self):
        customer = self.get_customer()
        return (
            Transaction.objects
            .filter(customer=customer)
            .select_related("reversal_of")
            .prefetch_related("reversals")
            .order_by("-transaction_date", "-created_at")
        )

    def create(self, request, *args, **kwargs):
        customer = self.get_customer()
        serializer = TransactionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            txn = create_transaction(
                customer=customer,
                transaction_type=serializer.validated_data["type"],
                amount=serializer.validated_data["amount"],
                description=serializer.validated_data.get("description", ""),
                quantity=serializer.validated_data.get("quantity", ""),
                transaction_date=serializer.validated_data["transaction_date"],
                created_by=request.user,
            )
        except ValueError as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Return the saved transaction with updated balance
        balance = calculate_balance(customer)
        response_serializer = TransactionSerializer(txn)
        return Response(
            {
                "transaction": response_serializer.data,
                "balance": str(balance),
                "message": (
                    f"₹{txn.amount:,.2f} {'credited' if txn.type == 'credit' else 'payment recorded'} successfully."
                ),
            },
            status=status.HTTP_201_CREATED,
        )


class TransactionDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/transactions/{id}/  — transaction detail
    PATCH /api/transactions/{id}/  — update description/date (not type/amount)
    """

    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            txn = (
                Transaction.objects
                .select_related("customer", "reversal_of")
                .prefetch_related("reversals")
                .get(id=self.kwargs["pk"], customer__user=self.request.user)
            )
            return txn
        except Transaction.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Transaction not found.")

    def update(self, request, *args, **kwargs):
        txn = self.get_object()

        # Prevent editing reversed transactions
        if txn.reversals.exists():
            return Response(
                {"message": "Cannot edit a transaction that has been reversed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if txn.type == "reversal":
            return Response(
                {"message": "Cannot edit a reversal record."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only allow editing description and transaction_date
        allowed_fields = {"description", "transaction_date"}
        filtered_data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = self.get_serializer(txn, data=filtered_data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reverse_transaction_view(request, pk):
    """POST /api/transactions/{id}/reverse/ — create an audit-safe reversal."""
    try:
        txn = Transaction.objects.select_related("customer").get(
            id=pk,
            customer__user=request.user,
        )
    except Transaction.DoesNotExist:
        return Response({"message": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        reversal = reverse_transaction(txn, created_by=request.user)
    except ValueError as e:
        return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    balance = calculate_balance(txn.customer)
    reversal_serializer = TransactionSerializer(reversal)
    return Response(
        {
            "reversal": reversal_serializer.data,
            "balance": str(balance),
            "message": "Transaction reversed successfully.",
        },
        status=status.HTTP_201_CREATED,
    )


class TransactionListView(generics.ListAPIView):
    """
    GET /api/transactions/ — shop-wide recent activity for authenticated shopkeeper
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        from customers.models import CustomerStatus
        return (
            Transaction.objects
            .filter(customer__user=self.request.user, customer__status=CustomerStatus.ACTIVE)
            .select_related("customer", "reversal_of")
            .prefetch_related("reversals")
            .order_by("-transaction_date", "-created_at")[:100]
        )

