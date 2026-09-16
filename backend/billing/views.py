"""Billing views — invoice CRUD and lifecycle endpoints."""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from customers.models import Customer
from customers.services import get_customer_for_user
from .models import Invoice
from .serializers import (
    InvoiceSerializer,
    InvoiceListSerializer,
    InvoiceCreateSerializer,
)
from .services import create_invoice, cancel_invoice, get_next_invoice_number


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def invoice_list_create_view(request):
    """
    GET  /api/invoices/  — list invoices with optional filters
    POST /api/invoices/  — create a new invoice
    """
    if request.method == "GET":
        queryset = Invoice.objects.filter(user=request.user)

        # Status filter
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(payment_status=status_filter)

        # Search by invoice number or customer name
        search = request.query_params.get("search")
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(invoice_number__icontains=search) |
                Q(customer_name__icontains=search)
            )

        # Date range filters
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from:
            queryset = queryset.filter(invoice_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(invoice_date__lte=date_to)

        queryset = queryset.order_by("-invoice_date", "-created_at")[:100]
        serializer = InvoiceListSerializer(queryset, many=True)
        return Response(serializer.data)

    # POST — create invoice
    serializer = InvoiceCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # Resolve customer if customer_id is provided
    customer = None
    customer_id = data.get("customer_id")
    if customer_id:
        try:
            customer = get_customer_for_user(customer_id, request.user)
        except Customer.DoesNotExist:
            return Response(
                {"message": "Customer not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    try:
        invoice = create_invoice(
            user=request.user,
            customer=customer,
            customer_name=data["customer_name"],
            customer_phone=data.get("customer_phone", ""),
            invoice_date=data["invoice_date"],
            due_date=data.get("due_date"),
            payment_mode=data.get("payment_mode", "cash"),
            discount_type=data.get("discount_type", "flat"),
            discount_value=data.get("discount_value", 0),
            tax_rate=data.get("tax_rate", 0),
            paid_amount=data.get("paid_amount", 0),
            notes=data.get("notes", ""),
            terms=data.get("terms", "Goods once sold will not be taken back."),
            items=data["items"],
        )
    except ValueError as e:
        return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    response_serializer = InvoiceSerializer(invoice)
    return Response(
        {
            "invoice": response_serializer.data,
            "message": f"Invoice {invoice.invoice_number} created successfully.",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def invoice_detail_view(request, pk):
    """GET /api/invoices/<id>/ — full invoice detail with items."""
    try:
        invoice = (
            Invoice.objects
            .prefetch_related("items")
            .get(id=pk, user=request.user)
        )
    except Invoice.DoesNotExist:
        return Response(
            {"message": "Invoice not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = InvoiceSerializer(invoice)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invoice_cancel_view(request, pk):
    """POST /api/invoices/<id>/cancel/ — void/cancel an invoice."""
    try:
        invoice = Invoice.objects.get(id=pk, user=request.user)
    except Invoice.DoesNotExist:
        return Response(
            {"message": "Invoice not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        invoice = cancel_invoice(invoice, user=request.user)
    except ValueError as e:
        return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    serializer = InvoiceSerializer(invoice)
    return Response(
        {
            "invoice": serializer.data,
            "message": f"Invoice {invoice.invoice_number} cancelled.",
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def invoice_next_number_view(request):
    """GET /api/invoices/next-number/ — get the next invoice number for the user."""
    next_number = get_next_invoice_number(request.user)
    return Response({"next_number": next_number})
