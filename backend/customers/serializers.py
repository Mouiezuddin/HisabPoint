"""Customer serializers."""
from rest_framework import serializers
from .models import Customer
from .services import get_customer_balance, get_balance_status


class CustomerSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()
    balance_status = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "phone",
            "address",
            "notes",
            "status",
            "balance",
            "balance_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "balance", "balance_status", "created_at", "updated_at"]

    def get_balance(self, obj):
        if hasattr(obj, "_balance"):
            return str(obj._balance)
        return str(get_customer_balance(obj))

    def get_balance_status(self, obj):
        if hasattr(obj, "_balance"):
            balance = obj._balance
        else:
            balance = get_customer_balance(obj)
        return get_balance_status(balance)

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Customer name is required.")
        return value.strip()

    def validate_phone(self, value):
        if value:
            digits = "".join(c for c in value if c.isdigit())
            if len(digits) > 0 and len(digits) < 7:
                raise serializers.ValidationError("Enter a valid phone number.")
        return value


class CustomerListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list view — includes balance."""
    balance = serializers.SerializerMethodField()
    balance_status = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ["id", "name", "phone", "status", "balance", "balance_status"]

    def get_balance(self, obj):
        # Use prefetched/annotated balance if available
        if hasattr(obj, "_balance"):
            return str(obj._balance)
        return str(get_customer_balance(obj))

    def get_balance_status(self, obj):
        from decimal import Decimal
        if hasattr(obj, "_balance"):
            balance = obj._balance
        else:
            balance = get_customer_balance(obj)
        return get_balance_status(balance)
