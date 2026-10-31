from decimal import Decimal
import datetime
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from .models import Supplier, SupplierStatus, SupplierTransactionType
from .services import (
    calculate_supplier_balance,
    create_supplier_transaction,
    reverse_supplier_transaction,
)

User = get_user_model()


class SupplierLedgerTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            email="merchant1@test.com",
            name="Merchant One",
            password="testpassword123",
        )
        self.user2 = User.objects.create_user(
            email="merchant2@test.com",
            name="Merchant Two",
            password="testpassword123",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)

    def test_create_supplier_and_tenant_isolation(self):
        supplier1 = Supplier.objects.create(
            user=self.user1,
            name="Ramesh Bhai",
            company_name="Ganesh Flour Mill",
            phone="+919876543212",
            gstin="27ABCDE1234F1Z5",
            upi_id="ganesh@okhdfcbank",
        )
        # Supplier for user 2
        Supplier.objects.create(
            user=self.user2,
            name="Suresh Trader",
            company_name="Balaji Agency",
        )

        response = self.client.get("/api/suppliers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        # Should only return user1's supplier
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["company_name"], "Ganesh Flour Mill")

    def test_supplier_balance_and_reversal(self):
        supplier = Supplier.objects.create(
            user=self.user1,
            name="Ramesh Bhai",
            company_name="Ganesh Flour Mill",
        )
        today = datetime.date.today()

        # 1. Purchase goods on credit for ₹10,000 (Dena Hai / We owe 10,000)
        txn1 = create_supplier_transaction(
            supplier=supplier,
            transaction_type=SupplierTransactionType.PURCHASE,
            amount=Decimal("10000.00"),
            bill_number="BILL-101",
            description="50 bags wheat flour",
            transaction_date=today,
            created_by=self.user1,
        )
        self.assertEqual(calculate_supplier_balance(supplier), Decimal("10000.00"))

        # 2. Pay ₹4,000 to supplier via UPI (Remaining debt: ₹6,000)
        txn2 = create_supplier_transaction(
            supplier=supplier,
            transaction_type=SupplierTransactionType.PAYMENT,
            amount=Decimal("4000.00"),
            description="UPI payment via PhonePe",
            transaction_date=today,
            created_by=self.user1,
        )
        self.assertEqual(calculate_supplier_balance(supplier), Decimal("6000.00"))

        # 3. Reverse the payment of ₹4,000 (Debt returns to ₹10,000)
        reverse_supplier_transaction(txn2, created_by=self.user1)
        self.assertEqual(calculate_supplier_balance(supplier), Decimal("10000.00"))

    def test_supplier_api_transactions(self):
        # Create supplier via API
        create_res = self.client.post(
            "/api/suppliers/",
            {
                "name": "Kailash",
                "company_name": "Amul Dairy Distributor",
                "phone": "+919822334455",
                "upi_id": "amul@icici",
            },
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        supplier_id = create_res.data["id"]

        # Record purchase transaction
        tx_res = self.client.post(
            f"/api/suppliers/{supplier_id}/transactions/",
            {
                "type": "purchase",
                "amount": "8500.00",
                "bill_number": "INV-772",
                "description": "50 Crates Milk",
                "transaction_date": str(datetime.date.today()),
            },
        )
        self.assertEqual(tx_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(tx_res.data["amount"], "8500.00")

        # Verify supplier balance is updated
        detail_res = self.client.get(f"/api/suppliers/{supplier_id}/")
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data["balance"], "8500.00")
        self.assertEqual(detail_res.data["balance_status"], "due")
