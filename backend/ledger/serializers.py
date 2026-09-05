"""Transaction serializers."""
from decimal import Decimal
from rest_framework import serializers
from .models import Transaction, TransactionType
from common.validators import validate_positive_amount


class TransactionSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[validate_positive_amount],
    )
    reversal_of_id = serializers.UUIDField(source="reversal_of.id", read_only=True, allow_null=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    is_reversed = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "customer",
            "customer_name",
            "type",
            "amount",
            "description",
            "quantity",
            "transaction_date",
            "reversal_of_id",
            "is_reversed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "customer",
            "customer_name",
            "reversal_of_id",
            "is_reversed",
            "created_at",
            "updated_at",
        ]

    def get_is_reversed(self, obj):
        return bool(obj.reversals.all())

    def validate_type(self, value):
        if value not in [TransactionType.CREDIT, TransactionType.PAYMENT]:
            raise serializers.ValidationError(
                "Transaction type must be 'credit' or 'payment'."
            )
        return value

    def validate_amount(self, value):
        validate_positive_amount(value)
        return value


class TransactionCreateSerializer(serializers.Serializer):
    """Used only for creating new transactions via the API."""
    type = serializers.ChoiceField(choices=[TransactionType.CREDIT, TransactionType.PAYMENT])
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    description = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")
    quantity = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    transaction_date = serializers.DateField()

    def validate_amount(self, value):
        validate_positive_amount(value)
        return value
