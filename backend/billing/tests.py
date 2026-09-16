"""Billing app tests — invoice creation, cancellation, and ledger integration."""
from decimal import Decimal
from django.test import TestCase
from django.utils import timezone

from accounts.models import User
from customers.models import Customer
from ledger.models import Transaction, TransactionType
from billing.models import Invoice, InvoiceStatus
from billing.services import create_invoice, cancel_invoice, get_next_invoice_number


class BillingTestBase(TestCase):
    """Shared setup for billing tests."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="shop@test.com",
            password="testpass123",
            name="Test Shopkeeper",
        )
        self.customer = Customer.objects.create(
            user=self.user,
            name="Test Customer",
            phone="9876543210",
        )
        self.today = timezone.localdate()
        self.sample_items = [
            {"name": "Basmati Rice 5kg", "quantity": 2, "unit": "pcs", "unit_price": 120},
            {"name": "Mustard Oil 1L", "quantity": 1, "unit": "ltr", "unit_price": 160},
        ]


class InvoiceCreationTests(BillingTestBase):
    """Test invoice creation with various scenarios."""

    def test_create_invoice_cash_paid(self):
        """A fully-paid cash invoice should NOT create a ledger transaction."""
        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            payment_mode="cash",
            paid_amount=Decimal("400.00"),  # 2*120 + 1*160 = 400
            items=self.sample_items,
        )

        self.assertEqual(invoice.payment_status, InvoiceStatus.PAID)
        self.assertEqual(invoice.subtotal, Decimal("400.00"))
        self.assertEqual(invoice.total_amount, Decimal("400.00"))
        self.assertEqual(invoice.paid_amount, Decimal("400.00"))
        self.assertIsNone(invoice.ledger_transaction)
        self.assertEqual(invoice.items.count(), 2)

        # No ledger transaction should be created for fully-paid bills
        txn_count = Transaction.objects.filter(
            customer=self.customer,
            type=TransactionType.CREDIT,
        ).count()
        self.assertEqual(txn_count, 0)

    def test_create_invoice_credit_unpaid(self):
        """An unpaid credit invoice should atomically create a CREDIT ledger transaction."""
        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            payment_mode="credit",
            paid_amount=Decimal("0.00"),
            items=self.sample_items,
        )

        self.assertEqual(invoice.payment_status, InvoiceStatus.UNPAID)
        self.assertEqual(invoice.total_amount, Decimal("400.00"))
        self.assertIsNotNone(invoice.ledger_transaction)

        # Verify the linked ledger transaction
        txn = invoice.ledger_transaction
        self.assertEqual(txn.type, TransactionType.CREDIT)
        self.assertEqual(txn.amount, Decimal("400.00"))
        self.assertEqual(txn.customer, self.customer)
        self.assertIn("Bill #", txn.description)

    def test_create_invoice_partially_paid(self):
        """A partially-paid invoice should create a ledger transaction for the balance only."""
        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            payment_mode="credit",
            paid_amount=Decimal("150.00"),
            items=self.sample_items,
        )

        self.assertEqual(invoice.payment_status, InvoiceStatus.PARTIALLY_PAID)
        self.assertIsNotNone(invoice.ledger_transaction)
        # Ledger transaction should be for balance_due = 400 - 150 = 250
        self.assertEqual(invoice.ledger_transaction.amount, Decimal("250.00"))

    def test_create_invoice_walkin_no_customer(self):
        """Walk-in cash bill without a linked customer should NOT create ledger transaction."""
        invoice = create_invoice(
            user=self.user,
            customer=None,
            customer_name="Walk-in Buyer",
            customer_phone="",
            invoice_date=self.today,
            payment_mode="cash",
            paid_amount=Decimal("400.00"),
            items=self.sample_items,
        )

        self.assertEqual(invoice.customer, None)
        self.assertEqual(invoice.customer_name, "Walk-in Buyer")
        self.assertEqual(invoice.payment_status, InvoiceStatus.PAID)
        self.assertIsNone(invoice.ledger_transaction)

    def test_create_invoice_with_discount_flat(self):
        """Flat discount should be subtracted from subtotal."""
        invoice = create_invoice(
            user=self.user,
            customer_name="Test",
            invoice_date=self.today,
            discount_type="flat",
            discount_value=Decimal("50.00"),
            paid_amount=Decimal("350.00"),
            items=self.sample_items,
        )

        self.assertEqual(invoice.subtotal, Decimal("400.00"))
        self.assertEqual(invoice.discount_amount, Decimal("50.00"))
        self.assertEqual(invoice.total_amount, Decimal("350.00"))

    def test_create_invoice_with_discount_percentage(self):
        """Percentage discount should be calculated from subtotal."""
        invoice = create_invoice(
            user=self.user,
            customer_name="Test",
            invoice_date=self.today,
            discount_type="percentage",
            discount_value=Decimal("10.00"),  # 10% of 400 = 40
            paid_amount=Decimal("360.00"),
            items=self.sample_items,
        )

        self.assertEqual(invoice.discount_amount, Decimal("40.00"))
        self.assertEqual(invoice.total_amount, Decimal("360.00"))

    def test_create_invoice_with_tax(self):
        """Tax should be applied after discount."""
        invoice = create_invoice(
            user=self.user,
            customer_name="Test",
            invoice_date=self.today,
            discount_type="flat",
            discount_value=Decimal("0.00"),
            tax_rate=Decimal("18.00"),  # 18% GST
            paid_amount=Decimal("472.00"),
            items=self.sample_items,
        )

        self.assertEqual(invoice.subtotal, Decimal("400.00"))
        self.assertEqual(invoice.tax_amount, Decimal("72.00"))
        self.assertEqual(invoice.total_amount, Decimal("472.00"))

    def test_create_invoice_no_items_raises(self):
        """Invoice without items should raise ValueError."""
        with self.assertRaises(ValueError) as ctx:
            create_invoice(
                user=self.user,
                customer_name="Test",
                invoice_date=self.today,
                items=[],
            )
        self.assertIn("item", str(ctx.exception).lower())


class InvoiceCancellationTests(BillingTestBase):
    """Test invoice cancellation and ledger reversal."""

    def test_cancel_invoice_reverses_ledger(self):
        """Cancelling a credit invoice should reverse the linked ledger transaction."""
        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            payment_mode="credit",
            paid_amount=Decimal("0.00"),
            items=self.sample_items,
        )

        self.assertIsNotNone(invoice.ledger_transaction)
        original_txn = invoice.ledger_transaction

        cancelled_invoice = cancel_invoice(invoice, user=self.user)
        self.assertEqual(cancelled_invoice.payment_status, InvoiceStatus.CANCELLED)

        # Verify reversal transaction was created
        reversals = original_txn.reversals.all()
        self.assertEqual(reversals.count(), 1)
        self.assertEqual(reversals[0].type, TransactionType.REVERSAL)

    def test_cancel_already_cancelled_raises(self):
        """Cancelling an already-cancelled invoice should raise ValueError."""
        invoice = create_invoice(
            user=self.user,
            customer_name="Test",
            invoice_date=self.today,
            paid_amount=Decimal("400.00"),
            items=self.sample_items,
        )
        cancel_invoice(invoice, user=self.user)

        with self.assertRaises(ValueError) as ctx:
            cancel_invoice(invoice, user=self.user)
        self.assertIn("already cancelled", str(ctx.exception).lower())


class InvoiceNumberSequenceTests(BillingTestBase):
    """Test sequential invoice number generation."""

    def test_first_invoice_number(self):
        """First invoice should be INV-0001."""
        num = get_next_invoice_number(self.user)
        self.assertEqual(num, "INV-0001")

    def test_sequential_numbers(self):
        """Invoice numbers should increment sequentially."""
        create_invoice(
            user=self.user,
            customer_name="Test",
            invoice_date=self.today,
            paid_amount=Decimal("400.00"),
            items=self.sample_items,
        )
        num = get_next_invoice_number(self.user)
        self.assertEqual(num, "INV-0002")

    def test_numbers_isolated_per_user(self):
        """Each user gets their own invoice number sequence."""
        other_user = User.objects.create_user(
            email="other@test.com",
            password="testpass123",
            name="Other Shopkeeper",
        )

        create_invoice(
            user=self.user,
            customer_name="Test",
            invoice_date=self.today,
            paid_amount=Decimal("400.00"),
            items=self.sample_items,
        )

        # Other user's first invoice should still be INV-0001
        num = get_next_invoice_number(other_user)
        self.assertEqual(num, "INV-0001")
