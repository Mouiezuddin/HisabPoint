"""Invoice serializers for API read/write operations."""
from decimal import Decimal
from rest_framework import serializers
from .models import Invoice, InvoiceItem, InvoiceStatus, PaymentMode, DiscountType


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Read serializer for invoice line items."""
    class Meta:
        model = InvoiceItem
        fields = [
            "id", "name", "quantity", "unit",
            "unit_price", "amount", "order",
        ]
        read_only_fields = ["id", "amount"]


class InvoiceItemCreateSerializer(serializers.Serializer):
    """Write serializer for creating invoice items (nested in InvoiceCreateSerializer)."""
    name = serializers.CharField(max_length=300)
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1.00"))
    unit = serializers.CharField(max_length=20, required=False, default="pcs")
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0.")
        return value

    def validate_unit_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than ₹0.")
        return value


class InvoiceSerializer(serializers.ModelSerializer):
    """Read serializer for invoice with nested items."""
    items = InvoiceItemSerializer(many=True, read_only=True)
    balance_due = serializers.SerializerMethodField()
    customer_id = serializers.UUIDField(source="customer.id", read_only=True, allow_null=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "customer_id", "customer_name", "customer_phone",
            "invoice_number", "invoice_date", "due_date",
            "payment_status", "payment_mode",
            "subtotal", "discount_type", "discount_value",
            "discount_amount", "tax_rate", "tax_amount",
            "total_amount", "paid_amount", "balance_due",
            "notes", "terms",
            "ledger_transaction_id",
            "items",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_balance_due(self, obj):
        return f"{obj.balance_due:.2f}"


class InvoiceCreateSerializer(serializers.Serializer):
    """Write serializer for creating a new invoice."""
    customer_id = serializers.UUIDField(required=False, allow_null=True)
    customer_name = serializers.CharField(max_length=200)
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    invoice_date = serializers.DateField()
    due_date = serializers.DateField(required=False, allow_null=True)
    payment_mode = serializers.ChoiceField(
        choices=PaymentMode.choices,
        default=PaymentMode.CASH,
    )
    discount_type = serializers.ChoiceField(
        choices=DiscountType.choices,
        default=DiscountType.FLAT,
    )
    discount_value = serializers.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
    )
    tax_rate = serializers.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0.00"),
    )
    paid_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
    )
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    terms = serializers.CharField(
        required=False, allow_blank=True,
        default="Goods once sold will not be taken back.",
    )
    items = InvoiceItemCreateSerializer(many=True)

    def validate_items(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one item is required.")
        return value

    def validate_paid_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Paid amount cannot be negative.")
        return value


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for invoice list views (no nested items)."""
    balance_due = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id", "customer_name", "customer_phone",
            "invoice_number", "invoice_date",
            "payment_status", "payment_mode",
            "total_amount", "paid_amount", "balance_due",
            "created_at",
        ]
        read_only_fields = fields

    def get_balance_due(self, obj):
        return f"{obj.balance_due:.2f}"
