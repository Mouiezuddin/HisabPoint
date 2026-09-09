"""Tests for customer management."""
# pyrefly: ignore [missing-import]
from django.test import TestCase
# pyrefly: ignore [missing-import]
from django.contrib.auth import get_user_model
# pyrefly: ignore [missing-import]
from customers.models import Customer, CustomerStatus
# pyrefly: ignore [missing-import]
from customers.services import get_customer_for_user, get_customer_balance

User = get_user_model()


class CustomerTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="shop@test.com", name="Shopkeeper", password="testpass123"
        )

    def test_create_customer_with_name_only(self):
        customer = Customer.objects.create(user=self.user, name="Rahul")
        self.assertEqual(customer.name, "Rahul")
        self.assertEqual(customer.status, CustomerStatus.ACTIVE)

    def test_new_customer_has_zero_balance(self):
        customer = Customer.objects.create(user=self.user, name="Sana")
        self.assertEqual(get_customer_balance(customer).as_tuple().sign, 0)

    def test_archive_customer_preserves_data(self):
        customer = Customer.objects.create(user=self.user, name="Vijay")
        customer.status = CustomerStatus.ARCHIVED
        customer.save()
        self.assertEqual(Customer.objects.get(id=customer.id).status, CustomerStatus.ARCHIVED)

    def test_search_by_name(self):
        Customer.objects.create(user=self.user, name="Aamir Khan")
        Customer.objects.create(user=self.user, name="Rahul Sharma")
        results = Customer.objects.filter(user=self.user, name__icontains="aamir")
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().name, "Aamir Khan")

    def test_search_by_phone(self):
        Customer.objects.create(user=self.user, name="Priya", phone="9876543210")
        results = Customer.objects.filter(user=self.user, phone__icontains="98765")
        self.assertEqual(results.count(), 1)

    def test_get_customer_wrong_user_raises(self):
        other_user = User.objects.create_user(
            email="other@test.com", name="Other", password="testpass123"
        )
        customer = Customer.objects.create(user=other_user, name="Secret Customer")
        with self.assertRaises(Customer.DoesNotExist):
            get_customer_for_user(customer.id, self.user)

    def test_customer_balance_with_reversals(self):
        from datetime import date
        from decimal import Decimal
        # pyrefly: ignore [missing-import]
        from ledger.models import TransactionType
        # pyrefly: ignore [missing-import]
        from ledger.services import create_transaction, reverse_transaction

        customer = Customer.objects.create(user=self.user, name="Test Customer")
        credit_txn = create_transaction(customer, TransactionType.CREDIT, "1200", "Rice", date.today(), self.user)
        payment_txn = create_transaction(customer, TransactionType.PAYMENT, "500", "Paid", date.today(), self.user)
        self.assertEqual(get_customer_balance(customer), Decimal("700.00"))

        reverse_transaction(credit_txn, self.user)
        # 1200 credit reversed -> 0 credit - 500 payment = -500 (advance)
        self.assertEqual(get_customer_balance(customer), Decimal("-500.00"))

    def test_search_with_archived_filter_api(self):
        from rest_framework.test import APIClient
        from rest_framework import status

        client = APIClient()
        client.force_authenticate(user=self.user)

        c1 = Customer.objects.create(user=self.user, name="Active John", status=CustomerStatus.ACTIVE)
        c2 = Customer.objects.create(user=self.user, name="Archived John", status=CustomerStatus.ARCHIVED)
        c3 = Customer.objects.create(user=self.user, name="Active Mary", status=CustomerStatus.ACTIVE)

        # Search for 'John' without archived filter -> only active John
        res = client.get("/api/customers/?search=John")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.json()["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Active John")

        # Search for 'John' WITH archived=true -> active John + archived John
        res2 = client.get("/api/customers/?search=John&archived=true")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        results2 = res2.json()["results"]
        self.assertEqual(len(results2), 2)
        names = {r["name"] for r in results2}
        self.assertEqual(names, {"Active John", "Archived John"})

    def test_delete_customer_without_transactions(self):
        from rest_framework.test import APIClient
        from rest_framework import status

        client = APIClient()
        client.force_authenticate(user=self.user)

        customer = Customer.objects.create(user=self.user, name="Delete Me")
        res = client.delete(f"/api/customers/{customer.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Customer.objects.filter(id=customer.id).exists())

    def test_delete_customer_with_transactions(self):
        from datetime import date
        from rest_framework.test import APIClient
        from rest_framework import status
        from ledger.models import Transaction, TransactionType
        from ledger.services import create_transaction

        client = APIClient()
        client.force_authenticate(user=self.user)

        customer = Customer.objects.create(user=self.user, name="Delete With Txns")
        create_transaction(customer, TransactionType.CREDIT, "500", "Items", date.today(), self.user)
        create_transaction(customer, TransactionType.PAYMENT, "200", "Cash", date.today(), self.user)

        self.assertEqual(Transaction.objects.filter(customer=customer).count(), 2)

        res = client.delete(f"/api/customers/{customer.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Customer.objects.filter(id=customer.id).exists())
        self.assertEqual(Transaction.objects.filter(customer=customer).count(), 0)

    def test_delete_customer_wrong_user_raises_404(self):
        from rest_framework.test import APIClient
        from rest_framework import status

        other_user = User.objects.create_user(
            email="other2@test.com", name="Other User", password="testpass123"
        )
        other_customer = Customer.objects.create(user=other_user, name="Protected Customer")

        client = APIClient()
        client.force_authenticate(user=self.user)

        res = client.delete(f"/api/customers/{other_customer.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Customer.objects.filter(id=other_customer.id).exists())

