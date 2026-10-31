"""
Django admin configuration for Hisab (Ledger) application.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Customer, LedgerEntry, Payment


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """
    Admin configuration for Customer model.
    """
    
    list_display = [
        'name', 'phone_number', 'email', 'current_balance', 
        'status', 'is_active', 'created_at'
    ]
    list_filter = ['status', 'is_active', 'created_at']
    search_fields = ['name', 'phone_number', 'email', 'address']
    readonly_fields = ['current_balance', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'phone_number', 'email', 'address')
        }),
        ('Financial Information', {
            'fields': ('credit_limit', 'opening_balance', 'current_balance')
        }),
        ('Status Information', {
            'fields': ('status', 'is_active', 'notes', 'tax_id')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        """
        Optimize queryset for admin display.
        """
        queryset = super().get_queryset(request)
        return queryset.select_related()


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    """
    Admin configuration for LedgerEntry model.
    """
    
    list_display = [
        'customer', 'entry_date', 'entry_type', 'transaction_type',
        'amount', 'is_settled', 'due_date', 'created_at'
    ]
    list_filter = ['entry_type', 'transaction_type', 'is_settled', 'entry_date']
    search_fields = [
        'customer__name', 'description', 'reference_number',
        'invoice_number', 'bill_number'
    ]
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['customer']
    date_hierarchy = 'entry_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer', 'entry_date', 'entry_type', 'transaction_type')
        }),
        ('Financial Details', {
            'fields': ('amount', 'description', 'reference_number')
        }),
        ('Settlement Information', {
            'fields': ('is_settled', 'settlement_date', 'due_date')
        }),
        ('Reference Information', {
            'fields': ('invoice_number', 'bill_number'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        """
        Optimize queryset for admin display.
        """
        queryset = super().get_queryset(request)
        return queryset.select_related('customer')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Admin configuration for Payment model.
    """
    
    list_display = [
        'customer', 'payment_date', 'payment_method', 'amount',
        'status', 'reconciled', 'created_at'
    ]
    list_filter = ['payment_method', 'status', 'reconciled', 'payment_date']
    search_fields = [
        'customer__name', 'reference_number', 'transaction_id',
        'bank_name', 'description'
    ]
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['customer']
    date_hierarchy = 'payment_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer', 'payment_date', 'payment_method', 'amount')
        }),
        ('Status Information', {
            'fields': ('status', 'reconciled', 'settlement_date')
        }),
        ('Payment Details', {
            'fields': ('reference_number', 'transaction_id', 'description', 'notes')
        }),
        ('Bank Information', {
            'fields': ('bank_name', 'account_number'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        """
        Optimize queryset for admin display.
        """
        queryset = super().get_queryset(request)
        return queryset.select_related('customer')