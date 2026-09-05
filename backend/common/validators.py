"""Shared validators."""
from decimal import Decimal
from rest_framework import serializers


def validate_positive_amount(value):
    """Amount must be a positive number with at most 2 decimal places."""
    if value is None:
        raise serializers.ValidationError("Enter an amount.")
    try:
        d = Decimal(str(value))
    except Exception:
        raise serializers.ValidationError("Enter a valid amount.")
    if d <= 0:
        raise serializers.ValidationError("Enter an amount greater than ₹0.")
    if d.as_tuple().exponent < -2:
        raise serializers.ValidationError("Amount cannot have more than 2 decimal places.")
    return value
