"""
Models for Hisab (Ledger) Django application.

This module defines the database models for customers, ledger entries,
and payments in the ledger system.
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
import uuid


class Customer(models.Model):
    """
    Customer model for storing customer information.
    
    Represents individuals or businesses that have accounts in the ledger system.
    """
    
    # Customer status choices
    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_SUSPENDED = 'suspended'
    
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INACTIVE, 'Inactive'),
        (STATUS_SUSPENDED, 'Suspended'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, verbose_name="Customer Name")
    phone_number = models.CharField(max_length=20, verbose_name="Phone Number", unique=True)
    email = models.EmailField(max_length=255, verbose_name="Email Address", blank=True, null=True)
    address = models.TextField(verbose_name="Address", blank=True, null=True)
    
    # Customer metadata
    credit_limit = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        verbose_name="Credit Limit",
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    opening_balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        verbose_name="Opening Balance",
        default=0.00
    )
    current_balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        verbose_name="Current Balance",
        default=0.00
    )
    
    # Status and flags
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        verbose_name="Customer Status"
    )
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    
    # Additional fields
    notes = models.TextField(verbose_name="Notes", blank=True, null=True)
    tax_id = models.CharField(max_length=50, verbose_name="Tax ID", blank=True, null=True)
    
    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.phone_number})"
    
    @property
    def total_credit(self):
        """Total credit amount for this customer."""
        return self.ledgerentry_set.filter(entry_type=LedgerEntry.ENTRY_TYPE_CREDIT).aggregate(
            total=models.Sum('amount')
        )['total'] or 0
    
    @property
    def total_debit(self):
        """Total debit amount for this customer."""
        return self.ledgerentry_set.filter(entry_type=LedgerEntry.ENTRY_TYPE_DEBIT).aggregate(
            total=models.Sum('amount')
        )['total'] or 0
    
    @property
    def total_payments(self):
        """Total payments made by this customer."""
        return self.payment_set.aggregate(
            total=models.Sum('amount')
        )['total'] or 0
    
    @property
    def net_balance(self):
        """Net balance (credit - debit - payments)."""
        return self.total_credit - self.total_debit - self.total_payments
    
    def update_balance(self):
        """Update the current balance field."""
        self.current_balance = self.net_balance
        self.save(update_fields=['current_balance', 'updated_at'])


class LedgerEntry(models.Model):
    """
    Ledger Entry model for recording financial transactions.
    
    Represents individual debit/credit entries in the customer's ledger.
    """
    
    # Entry type choices
    ENTRY_TYPE_CREDIT = 'credit'  # Customer owes money
    ENTRY_TYPE_DEBIT = 'debit'    # Customer pays/reduces debt
    
    ENTRY_TYPE_CHOICES = [
        (ENTRY_TYPE_CREDIT, 'Credit'),
        (ENTRY_TYPE_DEBIT, 'Debit'),
    ]
    
    # Transaction type choices
    TRANSACTION_SALE = 'sale'
    TRANSACTION_PURCHASE = 'purchase'
    TRANSACTION_RETURN = 'return'
    TRANSACTION_ADJUSTMENT = 'adjustment'
    TRANSACTION_OTHER = 'other'
    
    TRANSACTION_TYPE_CHOICES = [
        (TRANSACTION_SALE, 'Sale'),
        (TRANSACTION_PURCHASE, 'Purchase'),
        (TRANSACTION_RETURN, 'Return'),
        (TRANSACTION_ADJUSTMENT, 'Adjustment'),
        (TRANSACTION_OTHER, 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE, 
        verbose_name="Customer",
        related_name='ledger_entries'
    )
    
    # Entry details
    entry_date = models.DateField(verbose_name="Entry Date", default=timezone.now)
    entry_type = models.CharField(
        max_length=10,
        choices=ENTRY_TYPE_CHOICES,
        verbose_name="Entry Type"
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES,
        default=TRANSACTION_SALE,
        verbose_name="Transaction Type"
    )
    
    # Financial details
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        verbose_name="Amount",
        validators=[MinValueValidator(0.01)]
    )
    description = models.TextField(verbose_name="Description", blank=True, null=True)
    reference_number = models.CharField(
        max_length=100, 
        verbose_name="Reference Number", 
        blank=True, 
        null=True
    )
    
    # Status
    is_settled = models.BooleanField(default=False, verbose_name="Is Settled")
    settlement_date = models.DateField(verbose_name="Settlement Date", blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    
    # Additional metadata
    invoice_number = models.CharField(max_length=100, verbose_name="Invoice Number", blank=True, null=True)
    bill_number = models.CharField(max_length=100, verbose_name="Bill Number", blank=True, null=True)
    due_date = models.DateField(verbose_name="Due Date", blank=True, null=True)
    
    class Meta:
        verbose_name = "Ledger Entry"
        verbose_name_plural = "Ledger Entries"
        ordering = ['-entry_date', '-created_at']
        indexes = [
            models.Index(fields=['customer', 'entry_date']),
            models.Index(fields=['entry_type']),
            models.Index(fields=['entry_date']),
            models.Index(fields=['is_settled']),
            models.Index(fields=['reference_number']),
        ]
    
    def __str__(self):
        return f"{self.entry_type.upper()} - {self.amount} - {self.customer.name} - {self.entry_date}"
    
    def save(self, *args, **kwargs):
        """Override save to update customer balance."""
        is_new = self._state.adding
        
        # Call the original save method
        super().save(*args, **kwargs)
        
        # Update customer balance if this is a new entry
        if is_new:
            self.customer.update_balance()
    
    def delete(self, *args, **kwargs):
        """Override delete to update customer balance."""
        customer = self.customer
        
        # Call the original delete method
        super().delete(*args, **kwargs)
        
        # Update customer balance
        customer.update_balance()


class Payment(models.Model):
    """
    Payment model for recording customer payments.
    
    Represents payments made by customers against their ledger balances.
    """
    
    # Payment method choices
    PAYMENT_CASH = 'cash'
    PAYMENT_BANK_TRANSFER = 'bank_transfer'
    PAYMENT_CHECK = 'check'
    PAYMENT_CARD = 'card'
    PAYMENT_DIGITAL = 'digital'
    
    PAYMENT_METHOD_CHOICES = [
        (PAYMENT_CASH, 'Cash'),
        (PAYMENT_BANK_TRANSFER, 'Bank Transfer'),
        (PAYMENT_CHECK, 'Check'),
        (PAYMENT_CARD, 'Card'),
        (PAYMENT_DIGITAL, 'Digital Payment'),
    ]
    
    # Payment status choices
    STATUS_PENDING = 'pending'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_REFUNDED = 'refunded'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REFUNDED, 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE, 
        verbose_name="Customer",
        related_name='payments'
    )
    
    # Payment details
    payment_date = models.DateField(verbose_name="Payment Date", default=timezone.now)
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default=PAYMENT_CASH,
        verbose_name="Payment Method"
    )
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        verbose_name="Amount",
        validators=[MinValueValidator(0.01)]
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_COMPLETED,
        verbose_name="Payment Status"
    )
    
    # Reference information
    reference_number = models.CharField(
        max_length=100, 
        verbose_name="Reference Number", 
        blank=True, 
        null=True
    )
    transaction_id = models.CharField(
        max_length=100, 
        verbose_name="Transaction ID", 
        blank=True, 
        null=True
    )
    bank_name = models.CharField(max_length=100, verbose_name="Bank Name", blank=True, null=True)
    account_number = models.CharField(max_length=50, verbose_name="Account Number", blank=True, null=True)
    
    # Description
    description = models.TextField(verbose_name="Description", blank=True, null=True)
    notes = models.TextField(verbose_name="Notes", blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    
    # Settlement information
    settlement_date = models.DateField(verbose_name="Settlement Date", blank=True, null=True)
    reconciled = models.BooleanField(default=False, verbose_name="Reconciled")
    
    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['customer', 'payment_date']),
            models.Index(fields=['payment_method']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['reference_number']),
        ]
    
    def __str__(self):
        return f"{self.amount} - {self.customer.name} - {self.payment_date} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        """Override save to update customer balance."""
        is_new = self._state.adding
        
        # Call the original save method
        super().save(*args, **kwargs)
        
        # Update customer balance if this is a new payment
        if is_new:
            self.customer.update_balance()
    
    def delete(self, *args, **kwargs):
        """Override delete to update customer balance."""
        customer = self.customer
        
        # Call the original delete method
        super().delete(*args, **kwargs)
        
        # Update customer balance
        customer.update_balance()
    
    def mark_as_completed(self):
        """Mark payment as completed."""
        if self.status != self.STATUS_COMPLETED:
            self.status = self.STATUS_COMPLETED
            self.save(update_fields=['status', 'updated_at'])
    
    def mark_as_failed(self):
        """Mark payment as failed."""
        if self.status != self.STATUS_FAILED:
            self.status = self.STATUS_FAILED
            self.save(update_fields=['status', 'updated_at'])
    
    def mark_as_refunded(self):
        """Mark payment as refunded."""
        if self.status != self.STATUS_REFUNDED:
            self.status = self.STATUS_REFUNDED
            self.save(update_fields=['status', 'updated_at'])