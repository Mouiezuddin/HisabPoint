"""Supplier views — tenant-isolated endpoints for payables and vendor ledger."""
from typing import Any, cast
from decimal import Decimal
from django.db import transaction as db_transaction
from django.db.models import Q, Sum, Value, DecimalField
from django.db.models.functions import Coalesce
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Supplier, SupplierStatus, SupplierTransaction, SupplierTransactionType
from .serializers import (
    SupplierSerializer,
    SupplierListSerializer,
    SupplierTransactionSerializer,
    SupplierTransactionCreateSerializer,
)
from .services import (
    get_supplier_for_user,
    annotate_supplier_balance,
    create_supplier_transaction,
    reverse_supplier_transaction,
)


class SupplierListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/suppliers/ — list own suppliers with running balances and search
    POST /api/suppliers/ — create a new supplier
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self) -> Any:
        if self.request.method == "GET":
            return SupplierListSerializer
        return SupplierSerializer

    def get_queryset(self) -> Any:
        user = self.request.user
        req = cast(Request, self.request)
        include_archived = req.query_params.get("archived") == "true"

        if include_archived:
            qs = Supplier.objects.filter(user=user)
        else:
            qs = Supplier.objects.filter(user=user, status=SupplierStatus.ACTIVE)

        search = req.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(company_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(gstin__icontains=search)
            )

        annotated_qs = annotate_supplier_balance(qs)

        # Optional balance filter: due, advance, settled
        filter_status = req.query_params.get("filter", "").lower().strip()
        if filter_status == "due":
            annotated_qs = annotated_qs.filter(_balance__gt=0)
        elif filter_status == "advance":
            annotated_qs = annotated_qs.filter(_balance__lt=0)
        elif filter_status == "settled":
            annotated_qs = annotated_qs.filter(_balance=0)

        return annotated_qs.order_by("company_name", "name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SupplierDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/suppliers/{id}/ — supplier detail with balance
    PATCH  /api/suppliers/{id}/ — update supplier info
    DELETE /api/suppliers/{id}/ — delete supplier and records
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SupplierSerializer

    def get_object(self) -> Any:
        try:
            qs = annotate_supplier_balance(Supplier.objects.filter(user=self.request.user))
            return qs.get(pk=self.kwargs["pk"])
        except Supplier.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Supplier not found.")

    def destroy(self, request, *args, **kwargs):
        supplier = self.get_object()
        name = supplier.company_name or supplier.name
        with db_transaction.atomic():
            SupplierTransaction.objects.filter(supplier=supplier).delete()
            supplier.delete()
        return Response(
            {"message": f"Supplier '{name}' and associated records deleted successfully."},
            status=status.HTTP_200_OK,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def supplier_summary_view(request):
    """
    GET /api/suppliers/summary/
    Returns aggregate payables metrics: total Dena Hai, supplier count, etc.
    """
    user = request.user
    output_field = DecimalField(max_digits=12, decimal_places=2)
    zero = Value(Decimal("0.00"), output_field=output_field)

    qs = annotate_supplier_balance(Supplier.objects.filter(user=user, status=SupplierStatus.ACTIVE))

    total_payable = Decimal("0.00")
    total_advance = Decimal("0.00")
    suppliers_due_count = 0

    for s in qs.values("id", "_balance"):
        bal = s["_balance"]
        if bal > Decimal("0.00"):
            total_payable += bal
            suppliers_due_count += 1
        elif bal < Decimal("0.00"):
            total_advance += abs(bal)

    # Monthly purchases & payments
    from django.utils import timezone
    today = timezone.localdate()
    month_start = today.replace(day=1)

    tx_agg = SupplierTransaction.objects.filter(
        supplier__user=user,
        supplier__status=SupplierStatus.ACTIVE,
    ).aggregate(
        month_purchases=Coalesce(
            Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, type=SupplierTransactionType.PURCHASE)),
            zero,
            output_field=output_field,
        ) - Coalesce(
            Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, type=SupplierTransactionType.REVERSAL, reversal_of__type=SupplierTransactionType.PURCHASE)),
            zero,
            output_field=output_field,
        ),
        month_payments=Coalesce(
            Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, type=SupplierTransactionType.PAYMENT)),
            zero,
            output_field=output_field,
        ) - Coalesce(
            Sum("amount", filter=Q(transaction_date__gte=month_start, transaction_date__lte=today, type=SupplierTransactionType.REVERSAL, reversal_of__type=SupplierTransactionType.PAYMENT)),
            zero,
            output_field=output_field,
        ),
    )

    return Response(
        {
            "total_payable": f"{total_payable:.2f}",
            "total_advance": f"{total_advance:.2f}",
            "suppliers_due_count": suppliers_due_count,
            "total_suppliers": qs.count(),
            "month_purchases": f"{tx_agg['month_purchases']:.2f}",
            "month_payments": f"{tx_agg['month_payments']:.2f}",
        }
    )


class SupplierTransactionListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/suppliers/{pk}/transactions/ — supplier's transaction history
    POST /api/suppliers/{pk}/transactions/ — record a new purchase or payment
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SupplierTransactionCreateSerializer
        return SupplierTransactionSerializer

    def get_supplier(self):
        try:
            return get_supplier_for_user(self.kwargs["pk"], self.request.user)
        except Supplier.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Supplier not found.")

    def get_queryset(self):
        supplier = self.get_supplier()
        return (
            SupplierTransaction.objects
            .filter(supplier=supplier)
            .select_related("reversal_of")
            .prefetch_related("reversals")
            .order_by("-transaction_date", "-created_at")
        )

    def create(self, request, *args, **kwargs):
        supplier = self.get_supplier()
        serializer = SupplierTransactionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            txn = create_supplier_transaction(
                supplier=supplier,
                transaction_type=serializer.validated_data["type"],
                amount=serializer.validated_data["amount"],
                bill_number=serializer.validated_data.get("bill_number", ""),
                description=serializer.validated_data.get("description", ""),
                transaction_date=serializer.validated_data["transaction_date"],
                created_by=request.user,
                transaction_time=serializer.validated_data.get("transaction_time"),
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        out_serializer = SupplierTransactionSerializer(txn)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reverse_supplier_transaction_view(request, pk):
    """
    POST /api/suppliers/transactions/{id}/reverse/
    Audit-safe reversal of an erroneous purchase or payment record.
    """
    try:
        txn = SupplierTransaction.objects.select_related("supplier").get(
            id=pk, supplier__user=request.user
        )
    except SupplierTransaction.DoesNotExist:
        return Response({"error": "Transaction not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        reversal = reverse_supplier_transaction(txn, request.user)
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    serializer = SupplierTransactionSerializer(reversal)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
