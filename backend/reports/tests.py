"""Tests for reports and dashboard metrics."""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from customers.models import Customer, CustomerStatus
from ledger.models import TransactionType
from ledger.services import create_transaction, reverse_transaction

User = get_user_model()


class DashboardTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="reports_user@test.com",
            name="Report User",
            password="testpass123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.today = timezone.localdate()

    def test_dashboard_metrics_with_reversals(self):
        customer = Customer.objects.create(user=self.user, name="Dashboard Customer")
        
        # Credit 1000 today
        c1 = create_transaction(customer, TransactionType.CREDIT, "1000", "Item A", self.today, self.user)
        # Credit 500 today
        c2 = create_transaction(customer, TransactionType.CREDIT, "500", "Item B", self.today, self.user)
        # Payment 300 today
        p1 = create_transaction(customer, TransactionType.PAYMENT, "300", "Paid", self.today, self.user)

        # Reverse c2 (500 credit)
        reverse_transaction(c2, self.user)

        response = self.client.get("/api/dashboard/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        # Net today_given should be 1000.00 (1000 + 500 - 500 reversal), NOT 1500
        self.assertEqual(data["today_given"], "1000.00")
        self.assertEqual(data["today_received"], "300.00")
        self.assertEqual(data["total_due"], "700.00")
        self.assertEqual(len(data["customers_with_due"]), 1)
        self.assertEqual(data["customers_with_due"][0]["balance"], "700.00")
        self.assertEqual(data["customers_with_due"][0]["last_transaction"], "Today")
