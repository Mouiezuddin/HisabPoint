from django.urls import path
from .views import (
    SupplierListCreateView,
    SupplierDetailView,
    supplier_summary_view,
    SupplierTransactionListCreateView,
    reverse_supplier_transaction_view,
)

urlpatterns = [
    path("", SupplierListCreateView.as_view(), name="supplier-list-create"),
    path("summary/", supplier_summary_view, name="supplier-summary"),
    path("<uuid:pk>/", SupplierDetailView.as_view(), name="supplier-detail"),
    path("<uuid:pk>/transactions/", SupplierTransactionListCreateView.as_view(), name="supplier-transactions"),
    path("transactions/<uuid:pk>/reverse/", reverse_supplier_transaction_view, name="supplier-transaction-reverse"),
]
