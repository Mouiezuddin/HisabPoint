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
        """First invoice should be RP-000001."""
        num = get_next_invoice_number(self.user)
        self.assertEqual(num, "RP-000001")

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
        self.assertEqual(num, "RP-000002")

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

        # Other user's first invoice should still be RP-000001
        num = get_next_invoice_number(other_user)
        self.assertEqual(num, "RP-000001")


class HisabPointRequirementTests(BillingTestBase):
    """
    Direct verification of User Specification Cases 1 through 7.
    """

    def test_case_1_single_item_unpaid_due(self):
        """
        Case 1:
        1 item, ₹220, Paid ₹0
        Expected: Grand Total ₹220, Paid ₹0, Due ₹220, Status DUE (unpaid)
        """
        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            paid_amount=Decimal("0.00"),
            items=[{"name": "Rice", "quantity": 2, "unit": "kg", "unit_price": 110}],
        )

        self.assertEqual(invoice.total_amount, Decimal("220.00"))
        self.assertEqual(invoice.paid_amount, Decimal("0.00"))
        self.assertEqual(invoice.balance_due, Decimal("220.00"))
        self.assertEqual(invoice.payment_status, InvoiceStatus.UNPAID)

    def test_case_2_fully_paid(self):
        """
        Case 2:
        ₹1,000, Paid ₹1,000
        Expected: Due ₹0, Status PAID
        """
        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            paid_amount=Decimal("1000.00"),
            items=[{"name": "Bulk Grains", "quantity": 10, "unit": "kg", "unit_price": 100}],
        )

        self.assertEqual(invoice.total_amount, Decimal("1000.00"))
        self.assertEqual(invoice.paid_amount, Decimal("1000.00"))
        self.assertEqual(invoice.balance_due, Decimal("0.00"))
        self.assertEqual(invoice.payment_status, InvoiceStatus.PAID)

    def test_case_3_partially_paid(self):
        """
        Case 3:
        ₹1,000, Paid ₹400
        Expected: Due ₹600, Status PARTIALLY PAID
        """
        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            paid_amount=Decimal("400.00"),
            items=[{"name": "Bulk Grains", "quantity": 10, "unit": "kg", "unit_price": 100}],
        )

        self.assertEqual(invoice.total_amount, Decimal("1000.00"))
        self.assertEqual(invoice.paid_amount, Decimal("400.00"))
        self.assertEqual(invoice.balance_due, Decimal("600.00"))
        self.assertEqual(invoice.payment_status, InvoiceStatus.PARTIALLY_PAID)

    def test_case_4_multiple_items_subtotal(self):
        """
        Case 4:
        Multiple items:
        Rice: 2 × ₹110 = ₹220
        Sugar: 1 × ₹50 = ₹50
        Expected Subtotal: ₹270
        """
        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            items=[
                {"name": "Rice", "quantity": 2, "unit": "kg", "unit_price": 110},
                {"name": "Sugar", "quantity": 1, "unit": "kg", "unit_price": 50},
            ],
        )

        self.assertEqual(invoice.items.count(), 2)
        self.assertEqual(invoice.subtotal, Decimal("270.00"))
        self.assertEqual(invoice.total_amount, Decimal("270.00"))

    def test_case_5_legacy_transaction_backward_compatibility(self):
        """
        Case 5:
        Existing old transaction:
        Description: 'rice 2kg', Amount: ₹220
        The system must NOT invent Quantity = 2, Unit Price = ₹110.
        It must safely preserve Description and Amount.
        """
        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            items=[
                {"name": "rice 2kg", "amount": Decimal("220.00")},
            ],
        )

        item = invoice.items.first()
        self.assertEqual(item.name, "rice 2kg")
        self.assertEqual(item.amount, Decimal("220.00"))
        # Quantity and unit_price must NOT be invented
        self.assertIsNone(item.quantity)
        self.assertIsNone(item.unit_price)
        self.assertEqual(invoice.total_amount, Decimal("220.00"))

    def test_case_6_unauthorized_invoice_access(self):
        """
        Case 6:
        Unauthorized invoice access.
        User A must not access User B's invoice or PDF.
        """
        from rest_framework.test import APIClient

        user_b = User.objects.create_user(
            email="userb@test.com",
            password="testpass123",
            name="User B Shop",
        )
        invoice_b = create_invoice(
            user=user_b,
            customer_name="User B Customer",
            invoice_date=self.today,
            items=[{"name": "Item B", "quantity": 1, "unit_price": 500}],
        )

        client = APIClient()
        client.force_authenticate(user=self.user)  # Logged in as User A

        # User A tries to GET User B's invoice detail
        res_detail = client.get(f"/api/invoices/{invoice_b.id}/")
        self.assertEqual(res_detail.status_code, 404)

        # User A tries to GET User B's invoice PDF
        res_pdf = client.get(f"/api/invoices/{invoice_b.id}/pdf/")
        self.assertEqual(res_pdf.status_code, 404)

    def test_case_7_pdf_generation_validity(self):
        """
        Case 7:
        Invoice PDF:
        Verify PDF opens (starts with %PDF-), text is selectable, totals are correct.
        """
        from billing.reports import generate_invoice_pdf
        from rest_framework.test import APIClient

        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            items=[
                {"name": "Basmati Rice 5kg", "quantity": 2, "unit": "bag", "unit_price": 250},
                {"name": "Sugar 1kg", "quantity": 3, "unit": "kg", "unit_price": 45},
            ],
            paid_amount=Decimal("200.00"),
        )

        pdf_bytes = generate_invoice_pdf(invoice)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertGreater(len(pdf_bytes), 1000)

        # Test API endpoint
        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get(f"/api/invoices/{invoice.id}/pdf/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("attachment; filename=", response["Content-Disposition"])
        self.assertTrue(response.content.startswith(b"%PDF-"))

    def test_amount_in_words_inr(self):
        """Verify Indian numbering currency words conversion."""
        from billing.utils import amount_to_words_inr

        self.assertEqual(amount_to_words_inr(Decimal("220.00")), "Two Hundred and Twenty Rupees Only")
        self.assertEqual(amount_to_words_inr(Decimal("1000.00")), "One Thousand Rupees Only")
        self.assertEqual(amount_to_words_inr(Decimal("270.00")), "Two Hundred and Seventy Rupees Only")
        self.assertEqual(amount_to_words_inr(Decimal("100000.00")), "One Lakh Rupees Only")
        self.assertEqual(
            amount_to_words_inr(Decimal("220.50")),
            "Two Hundred and Twenty Rupees and Fifty Paise Only"
        )

    def test_billing_period_and_days_calculation(self):
        """Test invoice creation with billing period and days calculation."""
        from datetime import date, timedelta
        start = date(2026, 9, 23)
        end = date(2026, 9, 29)  # 7 days inclusive

        invoice = create_invoice(
            user=self.user,
            customer=self.customer,
            customer_name=self.customer.name,
            invoice_date=self.today,
            items=[{"name": "Rice 25kg", "quantity": 1, "unit": "bag", "unit_price": 1200}],
            billing_period_start=start,
            billing_period_end=end,
        )

        self.assertEqual(invoice.billing_period_start, start)
        self.assertEqual(invoice.billing_period_end, end)
        self.assertEqual(invoice.billing_period_days, 7)

        # Check serialized output
        from billing.serializers import InvoiceSerializer
        serializer = InvoiceSerializer(invoice)
        self.assertEqual(serializer.data["billing_period_days"], 7)
        self.assertEqual(serializer.data["billing_period_start"], "2026-09-23")
        self.assertEqual(serializer.data["billing_period_end"], "2026-09-29")


