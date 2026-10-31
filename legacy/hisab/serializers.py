"""
Serializers for Hisab (Ledger) Django application.

This module contains Django REST Framework serializers for converting
model instances to JSON and validating incoming data.
"""

from rest_framework import serializers
from django.utils import timezone
from .models import Customer, LedgerEntry, Payment


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for Customer model.
    
    Handles serialization and deserialization of Customer instances.
    """
    
    # Computed fields
    total_credit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_debit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_payments = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    current_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    net_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    # Related fields count
    ledger_entries_count = serializers.IntegerField(source='ledgerentry_set.count', read_only=True)
    payments_count = serializers.IntegerField(source='payment_set.count', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone_number', 'email', 'address',
            'credit_limit', 'opening_balance', 'current_balance',
            'status', 'is_active', 'notes', 'tax_id',
            'total_credit', 'total_debit', 'total_payments', 'net_balance',
            'ledger_entries_count', 'payments_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'current_balance']
    
    def validate_phone_number(self, value):
        """
        Validate phone number format.
        """
        if not value:
            raise serializers.ValidationError("Phone number is required.")
        
        # Basic phone number validation (can be extended based on requirements)
        if len(value) < 10:
            raise serializers.ValidationError("Phone number should be at least 10 digits.")
        
        return value
    
    def validate_email(self, value):
        """
        Validate email format.
        """
        if value and '@' not in value:
            raise serializers.ValidationError("Enter a valid email address.")
        
        return value
    
    def validate_credit_limit(self, value):
        """
        Validate credit limit is non-negative.
        """
        if value < 0:
            raise serializers.ValidationError("Credit limit cannot be negative.")
        
        return value
    
    def create(self, validated_data):
        """
        Create a new customer instance.
        
        Sets the current_balance to opening_balance for new customers.
        """
        # Set current_balance to opening_balance for new customers
        validated_data['current_balance'] = validated_data.get('opening_balance', 0)
        
        return super().create(validated_data)


class LedgerEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for LedgerEntry model.
    
    Handles serialization and deserialization of LedgerEntry instances.
    """
    
    # Customer details (nested representation)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    
    # Computed fields
    days_past_due = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = LedgerEntry
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'entry_date', 'entry_type', 'transaction_type',
            'amount', 'description', 'reference_number',
            'is_settled', 'settlement_date',
            'invoice_number', 'bill_number', 'due_date',
            'days_past_due', 'is_overdue',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_days_past_due(self, obj):
        """
        Calculate days past due if the entry has a due date.
        """
        if obj.due_date and obj.entry_type == LedgerEntry.ENTRY_TYPE_CREDIT:
            today = timezone.now().date()
            if obj.due_date < today and not obj.is_settled:
                return (today - obj.due_date).days
        return None
    
    def get_is_overdue(self, obj):
        """
        Determine if the entry is overdue.
        """
        if obj.due_date and obj.entry_type == LedgerEntry.ENTRY_TYPE_CREDIT:
            today = timezone.now().date()
            return obj.due_date < today and not obj.is_settled
        return False
    
    def validate_amount(self, value):
        """
        Validate amount is positive.
        """
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        
        return value
    
    def validate_entry_date(self, value):
        """
        Validate entry date is not in the future.
        """
        today = timezone.now().date()
        if value > today:
            raise serializers.ValidationError("Entry date cannot be in the future.")
        
        return value
    
    def validate_due_date(self, value):
        """
        Validate due date is after entry date.
        """
        entry_date = self.initial_data.get('entry_date')
        if entry_date and value:
            entry_date = serializers.DateField().to_internal_value(entry_date)
            if value < entry_date:
                raise serializers.ValidationError("Due date must be after entry date.")
        
        return value
    
    def validate(self, data):
        """
        Additional validation for ledger entry.
        """
        # Ensure settlement_date is after entry_date if provided
        if data.get('settlement_date') and data.get('entry_date'):
            if data['settlement_date'] < data['entry_date']:
                raise serializers.ValidationError({
                    'settlement_date': 'Settlement date must be after entry date.'
                })
        
        # Ensure is_settled and settlement_date are consistent
        if data.get('is_settled') and not data.get('settlement_date'):
            data['settlement_date'] = timezone.now().date()
        elif not data.get('is_settled') and data.get('settlement_date'):
            raise serializers.ValidationError({
                'is_settled': 'Cannot have settlement date without marking as settled.'
            })
        
        return data


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model.
    
    Handles serialization and deserialization of Payment instances.
    """
    
    # Customer details (nested representation)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone_number', read_only=True)
    
    # Computed fields
    payment_method_display = serializers.CharField(
        source='get_payment_method_display', 
        read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True
    )
    
    class Meta:
        model = Payment
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'payment_date', 'payment_method', 'payment_method_display',
            'amount', 'status', 'status_display',
            'reference_number', 'transaction_id',
            'bank_name', 'account_number',
            'description', 'notes',
            'settlement_date', 'reconciled',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_amount(self, value):
        """
        Validate amount is positive.
        """
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        
        return value
    
    def validate_payment_date(self, value):
        """
        Validate payment date is not in the future.
        """
        today = timezone.now().date()
        if value > today:
            raise serializers.ValidationError("Payment date cannot be in the future.")
        
        return value
    
    def validate_settlement_date(self, value):
        """
        Validate settlement date is after payment date.
        """
        payment_date = self.initial_data.get('payment_date')
        if payment_date and value:
            payment_date = serializers.DateField().to_internal_value(payment_date)
            if value < payment_date:
                raise serializers.ValidationError("Settlement date must be after payment date.")
        
        return value
    
    def validate(self, data):
        """
        Additional validation for payment.
        """
        # Bank details validation for bank transfer payments
        if data.get('payment_method') == Payment.PAYMENT_BANK_TRANSFER:
            if not data.get('bank_name'):
                raise serializers.ValidationError({
                    'bank_name': 'Bank name is required for bank transfer payments.'
                })
            if not data.get('account_number'):
                raise serializers.ValidationError({
                    'account_number': 'Account number is required for bank transfer payments.'
                })
        
        # Reference number validation for check payments
        if data.get('payment_method') == Payment.PAYMENT_CHECK:
            if not data.get('reference_number'):
                raise serializers.ValidationError({
                    'reference_number': 'Check number is required for check payments.'
                })
        
        # Transaction ID validation for digital payments
        if data.get('payment_method') == Payment.PAYMENT_DIGITAL:
            if not data.get('transaction_id'):
                raise serializers.ValidationError({
                    'transaction_id': 'Transaction ID is required for digital payments.'
                })
        
        return data


class CustomerBalanceSerializer(serializers.Serializer):
    """
    Serializer for customer balance information.
    
    Used for detailed balance views and reports.
    """
    
    customer = CustomerSerializer()
    
    balance_summary = serializers.DictField(
        child=serializers.DecimalField(max_digits=12, decimal_places=2)
    )
    
    recent_transactions = serializers.DictField(
        child=serializers.ListField(child=serializers.DictField())
    )
    
    class Meta:
        fields = ['customer', 'balance_summary', 'recent_transactions']


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics.
    
    Used for aggregating and presenting dashboard data.
    """
    
    customer_stats = serializers.DictField(
        child=serializers.IntegerField()
    )
    
    ledger_stats = serializers.DictField(
        child=serializers.DictField(
            child=serializers.DecimalField(max_digits=12, decimal_places=2)
        )
    )
    
    payment_stats = serializers.DictField(
        child=serializers.DictField(
            child=serializers.DecimalField(max_digits=12, decimal_places=2)
        )
    )
    
    top_debtors = serializers.ListField(
        child=serializers.DictField()
    )
    
    recent_activity = serializers.DictField(
        child=serializers.ListField(child=serializers.DictField())
    )
    
    class Meta:
        fields = [
            'customer_stats', 
            'ledger_stats', 
            'payment_stats', 
            'top_debtors', 
            'recent_activity'
        ]


class LedgerEntrySummarySerializer(serializers.Serializer):
    """
    Serializer for ledger entry summary statistics.
    """
    
    total_credit = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_debit = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_entries = serializers.IntegerField()
    average_credit = serializers.DecimalField(max_digits=12, decimal_places=2)
    average_debit = serializers.DecimalField(max_digits=12, decimal_places=2)
    
    class Meta:
        fields = [
            'total_credit', 'total_debit', 'net_balance',
            'total_entries', 'average_credit', 'average_debit'
        ]


class PaymentSummarySerializer(serializers.Serializer):
    """
    Serializer for payment summary statistics.
    """
    
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_payments = serializers.IntegerField()
    average_payment = serializers.DecimalField(max_digits=12, decimal_places=2)
    by_payment_method = serializers.ListField(child=serializers.DictField())
    by_status = serializers.ListField(child=serializers.DictField())
    
    class Meta:
        fields = [
            'total_amount', 'total_payments', 'average_payment',
            'by_payment_method', 'by_status'
        ]


class CustomerBalanceSummarySerializer(serializers.Serializer):
    """
    Serializer for customer balance summary.
    """
    
    customer_id = serializers.UUIDField()
    customer_name = serializers.CharField()
    phone_number = serializers.CharField()
    total_credit = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_debit = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_payments = serializers.DecimalField(max_digits=12, decimal_places=2)
    current_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    balance_type = serializers.CharField()
    last_transaction_date = serializers.DateField(allow_null=True)
    
    class Meta:
        fields = [
            'customer_id', 'customer_name', 'phone_number',
            'total_credit', 'total_debit', 'total_payments',
            'current_balance', 'balance_type', 'last_transaction_date'
        ]


class AllCustomersBalanceSerializer(serializers.Serializer):
    """
    Serializer for all customers balance summary.
    """
    
    summary = serializers.DictField(
        child=serializers.DecimalField(max_digits=12, decimal_places=2)
    )
    
    customers = serializers.ListField(
        child=CustomerBalanceSummarySerializer()
    )
    
    class Meta:
        fields = ['summary', 'customers']