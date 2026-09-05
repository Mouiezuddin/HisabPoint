"""
Tests for the ledger — balance calculation, partial payments, reversal, and authorization.
These are the most critical tests in the application.
"""
from decimal import Decimal
from datetime import date
from django.test import TestCase
from django.contrib.auth import get_user_model
from customers.models import Customer
from ledger.models import Transaction, TransactionType
from ledger.services import create_transaction, reverse_transaction, calculate_balance

User = get_user_model()


class LedgerBalanceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="shopkeeper@test.com",
            name="Test Shopkeeper",
            password="testpass123",
        )
        self.customer = Customer.objects.create(
            user=self.user,
            name="Aamir Khan",
            phone="9876543210",
        )
        self.today = date.today()

    def _credit(self, amount, description=""):
        return create_transaction(
            self.customer, TransactionType.CREDIT, amount, description, self.today, self.user
        )

    def _payment(self, amount, description=""):
        return create_transaction(
            self.customer, TransactionType.PAYMENT, amount, description, self.today, self.user
        )

    # --- Balance calculation tests ---

    def test_zero_balance_on_new_customer(self):
        self.assertEqual(calculate_balance(self.customer), Decimal("0"))

    def test_single_credit_increases_balance(self):
        self._credit("1000")
        self.assertEqual(calculate_balance(self.customer), Decimal("1000.00"))

    def test_payment_reduces_balance(self):
        self._credit("1000")
        self._payment("400")
        self.assertEqual(calculate_balance(self.customer), Decimal("600.00"))

    def test_full_payment_settles_balance(self):
        self._credit("500")
        self._payment("500")
        self.assertEqual(calculate_balance(self.customer), Decimal("0.00"))

    def test_multiple_credits(self):
        self._credit("1000")
        self._credit("2000")
        self._credit("500")
        self.assertEqual(calculate_balance(self.customer), Decimal("3500.00"))

    def test_multiple_payments_partial(self):
        self._credit("2000")
        self._payment("500")
        self._payment("1000")
        self.assertEqual(calculate_balance(self.customer), Decimal("500.00"))

    def test_overpayment_shows_advance(self):
        """Customer paying more than they owe results in a negative (advance) balance."""
        self._credit("1000")
        self._payment("1500")
        self.assertEqual(calculate_balance(self.customer), Decimal("-500.00"))

    def test_balance_persists_after_multiple_transactions(self):
        self._credit("5000")
        self._payment("2000")
        self._credit("1000")
        self._payment("500")
        # 5000 + 1000 - 2000 - 500 = 3500
        self.assertEqual(calculate_balance(self.customer), Decimal("3500.00"))

    # --- Validation tests ---

    def test_invalid_zero_amount_rejected(self):
        with self.assertRaises(ValueError):
            self._credit("0")

    def test_invalid_negative_amount_rejected(self):
        with self.assertRaises(ValueError):
            self._credit("-100")

    def test_invalid_transaction_type_rejected(self):
        with self.assertRaises(ValueError):
            create_transaction(
                self.customer, "INVALID_TYPE", "100", "", self.today, self.user
            )

    # --- Reversal tests ---

    def test_reversal_cancels_credit(self):
        txn = self._credit("1000")
        self.assertEqual(calculate_balance(self.customer), Decimal("1000.00"))
        reverse_transaction(txn, self.user)
        self.assertEqual(calculate_balance(self.customer), Decimal("0.00"))

    def test_reversal_cancels_payment(self):
        self._credit("1000")
        payment_txn = self._payment("500")
        self.assertEqual(calculate_balance(self.customer), Decimal("500.00"))
        reverse_transaction(payment_txn, self.user)
        self.assertEqual(calculate_balance(self.customer), Decimal("1000.00"))

    def test_cannot_reverse_twice(self):
        txn = self._credit("1000")
        reverse_transaction(txn, self.user)
        with self.assertRaises(ValueError):
            reverse_transaction(txn, self.user)

    def test_cannot_reverse_a_reversal(self):
        txn = self._credit("1000")
        reversal = reverse_transaction(txn, self.user)
        with self.assertRaises(ValueError):
            reverse_transaction(reversal, self.user)

    def test_original_transaction_preserved_after_reversal(self):
        txn = self._credit("1000")
        reverse_transaction(txn, self.user)
        # Original must still exist
        txn.refresh_from_db()
        self.assertEqual(txn.amount, Decimal("1000.00"))
        self.assertEqual(txn.type, TransactionType.CREDIT)


class AuthorizationTestCase(TestCase):
    """
    CRITICAL: User A must never access User B's data.
    """

    def setUp(self):
        self.user_a = User.objects.create_user(
            email="user_a@test.com", name="User A", password="testpass123"
        )
        self.user_b = User.objects.create_user(
            email="user_b@test.com", name="User B", password="testpass123"
        )
        self.customer_a = Customer.objects.create(user=self.user_a, name="Customer A")
        self.customer_b = Customer.objects.create(user=self.user_b, name="Customer B")

    def test_user_a_cannot_query_user_b_customer(self):
        """
        get_customer_for_user should raise DoesNotExist when wrong user.
        """
        from customers.services import get_customer_for_user
        with self.assertRaises(Customer.DoesNotExist):
            get_customer_for_user(self.customer_b.id, self.user_a)

    def test_user_a_cannot_see_user_b_transactions(self):
        """
        Transaction query filtered by customer__user must not return cross-user data.
        """
        today = date.today()
        create_transaction(
            self.customer_b, TransactionType.CREDIT, "1000", "Test", today, self.user_b
        )
        user_a_txns = Transaction.objects.filter(customer__user=self.user_a)
        self.assertEqual(user_a_txns.count(), 0)

    def test_user_a_customer_count_isolated(self):
        # User A has 1 customer, User B has 1 — queries must be isolated
        user_a_customers = Customer.objects.filter(user=self.user_a)
        user_b_customers = Customer.objects.filter(user=self.user_b)
        self.assertEqual(user_a_customers.count(), 1)
        self.assertEqual(user_b_customers.count(), 1)

    def test_idor_api_cross_user_customer_detail_rejected(self):
        from rest_framework.test import APIClient
        from rest_framework import status

        client = APIClient()
        client.force_authenticate(user=self.user_a)

        # User A attempts to GET User B's customer -> HTTP 404
        res = client.get(f"/api/customers/{self.customer_b.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_idor_api_cross_user_transaction_reversal_rejected(self):
        from rest_framework.test import APIClient
        from rest_framework import status

        client = APIClient()
        client.force_authenticate(user=self.user_a)

        txn_b = create_transaction(
            self.customer_b, TransactionType.CREDIT, "2000", "B's Item", date.today(), self.user_b
        )

        # User A attempts to reverse User B's transaction -> HTTP 404
        res = client.post(f"/api/transactions/{txn_b.id}/reverse/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
