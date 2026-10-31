"""
URL configuration for Hisab (Ledger) application.

Defines all API endpoints for the ledger system.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet,
    LedgerEntryViewSet,
    PaymentViewSet,
    DashboardView,
    CustomerBalanceView,
    login_view,
    register_view,
)

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'ledger-entries', LedgerEntryViewSet, basename='ledger-entry')
router.register(r'payments', PaymentViewSet, basename='payment')

# API URL patterns
urlpatterns = [
    # Authentication endpoints - completely public with @api_view decorator
    path('auth/login/', login_view, name='login'),
    path('auth/register/', register_view, name='register'),
    
    # Router-based endpoints
    path('', include(router.urls)),
    
    # Dashboard endpoints
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # Customer balance endpoints
    path('customer-balance/', CustomerBalanceView.as_view(), name='customer-balance-list'),
    path('customer-balance/<uuid:customer_id>/', CustomerBalanceView.as_view(), name='customer-balance-detail'),
    
    # Additional custom endpoints from viewset actions
    # These are automatically included by the router but we can also define them explicitly if needed
]

# API documentation endpoint (optional, for API browsers)
urlpatterns += [
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]