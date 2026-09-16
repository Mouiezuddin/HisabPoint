"""Invoice and InvoiceItem models — bill/invoice persistence layer."""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class InvoiceStatus(models.TextChoices):
    UNPAID = "unpaid", "Unpaid"
    PAID = "paid", "Paid"
    PARTIALLY_PAID = "partially_paid", "Partially Paid"
    CANCELLED = "cancelled", "Cancelled"


class PaymentMode(models.TextChoices):
    CREDIT = "credit", "Credit (Udhar)"
    CASH = "cash", "Cash"
    UPI = "upi", "UPI"
    CARD = "card", "Card"
    OTHER = "other", "Other"


class DiscountType(models.TextChoices):
    FLAT = "flat", "Flat"
    PERCENTAGE = "percentage", "Percentage"


class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    # Customer can be null for walk-in / cash customers
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    # Snapshot fields — stored at invoice creation time for fidelity
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=20, blank=True, default="")

    invoice_number = models.CharField(max_length=50)
    invoice_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)

    payment_status = models.CharField(
        max_length=20,
        choices=InvoiceStatus.choices,
        default=InvoiceStatus.UNPAID,
    )
    payment_mode = models.CharField(
        max_length=10,
        choices=PaymentMode.choices,
        default=PaymentMode.CASH,
    )

    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
    )
    discount_type = models.CharField(
        max_length=10,
        choices=DiscountType.choices,
        default=DiscountType.FLAT,
    )
    discount_value = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
    )
    discount_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
    )
    tax_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0.00"),
    )
    tax_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
    )
    paid_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
    )

    notes = models.TextField(blank=True, default="")
    terms = models.TextField(blank=True, default="Goods once sold will not be taken back.")

    # Link to ledger transaction created for credit invoices
    ledger_transaction = models.OneToOneField(
        "ledger.Transaction",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoice",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invoices"
        indexes = [
            models.Index(fields=["user", "invoice_date"]),
            models.Index(fields=["user", "payment_status"]),
            models.Index(fields=["user", "invoice_number"]),
        ]
        ordering = ["-invoice_date", "-created_at"]
        # Each user has unique invoice numbers
        constraints = [
            models.UniqueConstraint(
                fields=["user", "invoice_number"],
                name="unique_invoice_number_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.invoice_number} — {self.customer_name} — ₹{self.total_amount}"

    @property
    def balance_due(self):
        return self.total_amount - self.paid_amount


class InvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="items",
    )
    name = models.CharField(max_length=300)
    quantity = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("1.00"),
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    unit = models.CharField(max_length=20, blank=True, default="pcs")
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "invoice_items"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.name} × {self.quantity} = ₹{self.amount}"
