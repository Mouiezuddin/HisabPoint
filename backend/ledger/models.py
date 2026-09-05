"""Transaction model — the source of financial truth."""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class TransactionType(models.TextChoices):
    CREDIT = "credit", "Credit"      # Customer owes money (balance increases)
    PAYMENT = "payment", "Payment"   # Customer paid money (balance decreases)
    REVERSAL = "reversal", "Reversal"  # Correction record (handled by service)


class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,   # Never silently destroy customer with transactions
        related_name="transactions",
    )
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    description = models.CharField(max_length=500, blank=True, default="")
    quantity = models.CharField(max_length=100, blank=True, default="")
    transaction_date = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="transactions_created",
    )
    # For reversals — links back to the original transaction
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
        db_table = "transactions"
        indexes = [
            models.Index(fields=["customer", "transaction_date"]),
            models.Index(fields=["customer", "type"]),
            models.Index(fields=["created_by"]),
        ]
        ordering = ["-transaction_date", "-created_at"]

    def __str__(self):
        return f"{self.type.upper()} ₹{self.amount} for {self.customer.name}"
