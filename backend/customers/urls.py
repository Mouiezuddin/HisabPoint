from django.urls import path
from .views import (
    CustomerListCreateView,
    CustomerDetailView,
    archive_customer_view,
    restore_customer_view,
)
from ledger.views import CustomerTransactionListCreateView

urlpatterns = [
    path("", CustomerListCreateView.as_view(), name="customer-list-create"),
    path("<uuid:pk>/", CustomerDetailView.as_view(), name="customer-detail"),
    path("<uuid:pk>/archive/", archive_customer_view, name="customer-archive"),
    path("<uuid:pk>/restore/", restore_customer_view, name="customer-restore"),
    path("<uuid:pk>/transactions/", CustomerTransactionListCreateView.as_view(), name="customer-transactions"),
]
