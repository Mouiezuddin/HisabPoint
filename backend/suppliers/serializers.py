"""Supplier and SupplierTransaction serializers."""
from decimal import Decimal
from rest_framework import serializers

from .models import Supplier, SupplierTransaction, SupplierTransactionType
from .services import calculate_supplier_balance, get_supplier_balance_status


class SupplierSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    balance_status = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "company_name",
            "phone",
            "gstin",
            "upi_id",
            "address",
            "notes",
            "status",
            "balance",
            "balance_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "balance",
            "balance_status",
            "created_at",
            "updated_at",
        ]

    def get_balance(self, obj):
        bal = getattr(obj, "_balance", None)
        if bal is None:
            try:
                bal = calculate_supplier_balance(obj)
            except Exception:
                bal = Decimal("0.00")
        try:
            return f"{Decimal(str(bal if bal is not None else '0')):.2f}"
        except Exception:
            return "0.00"

    def get_balance_status(self, obj):
        bal = getattr(obj, "_balance", None)
        if bal is None:
            try:
                bal = calculate_supplier_balance(obj)
            except Exception:
                bal = Decimal("0.00")
        try:
            return get_supplier_balance_status(Decimal(str(bal if bal is not None else '0')))
        except Exception:
            return "settled"

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Supplier contact name is required.")
        return value.strip()

    def validate_phone(self, value):
        if value:
            digits = "".join(c for c in value if c.isdigit())
            if 0 < len(digits) < 7:
                raise serializers.ValidationError("Enter a valid phone number.")
        return value.strip()

    def validate_gstin(self, value):
        if value:
            clean = value.strip().upper()
            if len(clean) > 15:
                raise serializers.ValidationError("GSTIN cannot exceed 15 characters.")
            return clean
        return ""


class SupplierListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list view."""
    balance = serializers.SerializerMethodField()
    balance_status = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            "id",
            "name",
            "company_name",
            "phone",
            "gstin",
            "upi_id",
            "status",
            "balance",
            "balance_status",
        ]

    def get_balance(self, obj):
        bal = getattr(obj, "_balance", None)
        if bal is None:
            try:
                bal = calculate_supplier_balance(obj)
            except Exception:
                bal = Decimal("0.00")
        try:
            return f"{Decimal(str(bal if bal is not None else '0')):.2f}"
        except Exception:
            return "0.00"

    def get_balance_status(self, obj):
        bal = getattr(obj, "_balance", None)
        if bal is None:
            try:
                bal = calculate_supplier_balance(obj)
            except Exception:
                bal = Decimal("0.00")
        try:
            return get_supplier_balance_status(Decimal(str(bal if bal is not None else '0')))
        except Exception:
            return "settled"


class SupplierTransactionSerializer(serializers.ModelSerializer):
    is_reversed = serializers.SerializerMethodField()
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    supplier_company = serializers.CharField(source="supplier.company_name", read_only=True)

    class Meta:
        model = SupplierTransaction
        fields = [
            "id",
            "supplier",
            "supplier_name",
            "supplier_company",
            "type",
            "amount",
            "bill_number",
            "description",
            "transaction_date",
            "is_reversed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "supplier", "is_reversed", "created_at", "updated_at"]

    def get_is_reversed(self, obj):
        return obj.reversals.exists()


class SupplierTransactionCreateSerializer(serializers.Serializer):
    type = serializers.ChoiceField(
        choices=[
            (SupplierTransactionType.PURCHASE, "Purchase"),
            (SupplierTransactionType.PAYMENT, "Payment"),
        ]
    )
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    bill_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    description = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    transaction_date = serializers.DateField(required=True)
    transaction_time = serializers.CharField(required=False, allow_blank=True, default="")
