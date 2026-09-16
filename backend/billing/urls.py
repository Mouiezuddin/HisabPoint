from django.urls import path
from .views import (
    invoice_list_create_view,
    invoice_detail_view,
    invoice_cancel_view,
    invoice_next_number_view,
)

urlpatterns = [
    path("", invoice_list_create_view, name="invoice-list-create"),
    path("next-number/", invoice_next_number_view, name="invoice-next-number"),
    path("<uuid:pk>/", invoice_detail_view, name="invoice-detail"),
    path("<uuid:pk>/cancel/", invoice_cancel_view, name="invoice-cancel"),
]
