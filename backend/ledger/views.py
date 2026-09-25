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
                transaction_time=serializer.validated_data.get("transaction_time"),
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


from django.db import transaction as db_transaction


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/transactions/{id}/  — transaction detail
    PATCH  /api/transactions/{id}/  — update description/date (not type/amount)
    DELETE /api/transactions/{id}/  — permanently delete transaction and leave no history
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

    def destroy(self, request, *args, **kwargs):
        txn = self.get_object()
        customer = txn.customer

        with db_transaction.atomic():
            # If this transaction has reversals, delete them too so no trace or history remains
            Transaction.objects.filter(reversal_of=txn).delete()
            # If linked to an invoice, clear the reference
            if hasattr(txn, "invoice") and txn.invoice:
                txn.invoice.ledger_transaction = None
                txn.invoice.save(update_fields=["ledger_transaction"])
            txn.delete()

        new_balance = calculate_balance(customer)
        return Response(
            {
                "message": "Transaction permanently deleted.",
                "balance": str(new_balance),
            },
            status=status.HTTP_200_OK,
        )


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
        limit = self.request.query_params.get("limit")
        limit_val = 100
        if limit:
            try:
                parsed = int(limit)
                if parsed > 0:
                    limit_val = min(parsed, 100)
            except ValueError:
                pass

        return (
            Transaction.objects
            .filter(customer__user=self.request.user, customer__status=CustomerStatus.ACTIVE)
            .select_related("customer", "reversal_of")
            .prefetch_related("reversals")
            .order_by("-transaction_date", "-created_at")[:limit_val]
        )

