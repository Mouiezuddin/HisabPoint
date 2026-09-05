from django.urls import path
from .views import TransactionDetailView, reverse_transaction_view, TransactionListView

urlpatterns = [
    path("", TransactionListView.as_view(), name="transaction-list"),
    path("<uuid:pk>/", TransactionDetailView.as_view(), name="transaction-detail"),
    path("<uuid:pk>/reverse/", reverse_transaction_view, name="transaction-reverse"),
]

