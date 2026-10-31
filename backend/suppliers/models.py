"""Supplier and SupplierTransaction models — the source of truth for payables (Dena Hai)."""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class SupplierStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    ARCHIVED = "archived", "Archived"


class Supplier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="suppliers",
    )
    name = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200, blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    gstin = models.CharField(max_length=15, blank=True, default="")
    upi_id = models.CharField(max_length=100, blank=True, default="")
    address = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=10,
        choices=SupplierStatus.choices,
        default=SupplierStatus.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "suppliers"
        indexes = [
            models.Index(fields=["user", "name"]),
            models.Index(fields=["user", "status"]),
        ]
        ordering = ["name"]

    def __str__(self):
        title = self.company_name or self.name
        return f"{title} (user: {self.user_id})"


class SupplierTransactionType(models.TextChoices):
    PURCHASE = "purchase", "Purchase"   # Goods bought on credit (liability / Dena Hai increases)
    PAYMENT = "payment", "Payment"     # Payment sent to supplier (liability / Dena Hai decreases)
    REVERSAL = "reversal", "Reversal"  # Audit-safe correction entry


class SupplierTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name="transactions",
    )
    type = models.CharField(max_length=10, choices=SupplierTransactionType.choices)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    bill_number = models.CharField(max_length=100, blank=True, default="")
    description = models.CharField(max_length=500, blank=True, default="")
    transaction_date = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="supplier_transactions_created",
    )
    reversal_of = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reversals",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supplier_transactions"
        indexes = [
            models.Index(fields=["supplier", "transaction_date"]),
            models.Index(fields=["supplier", "type"]),
            models.Index(fields=["created_by"]),
        ]
        ordering = ["-transaction_date", "-created_at"]

    def __str__(self):
        return f"{self.type.upper()} ₹{self.amount} for {self.supplier.name}"
