"""
Views for Hisab (Ledger) Django application.

This module contains all API views for managing customers, ledger entries,
payments, and dashboard analytics for the ledger system.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
import logging

# Assuming models and serializers are defined in the same app
from .models import Customer, LedgerEntry, Payment
from .serializers import (
    CustomerSerializer, 
    LedgerEntrySerializer, 
    PaymentSerializer,
    CustomerBalanceSerializer,
    DashboardStatsSerializer
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    User registration endpoint.
    Completely public - no authentication required.
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response(
            {'error': 'username, email, and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already registered'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    User login endpoint.
    Completely public - no authentication required.
    """
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'detail': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {'detail': 'Invalid email or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'detail': 'User account is inactive'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    }, status=status.HTTP_200_OK)


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Customer records.
    
    Provides CRUD operations for customers with additional custom actions
    for ledger-related operations.
    """
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Optionally filter customers by name or phone number.
        """
        queryset = super().get_queryset()
        
        # Filter by search query
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(phone_number__icontains=search_query) |
                Q(email__icontains=search_query)
            )
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def ledger_entries(self, request, pk=None):
        """
        Get all ledger entries for a specific customer.
        """
        customer = self.get_object()
        ledger_entries = LedgerEntry.objects.filter(customer=customer).order_by('-entry_date')
        serializer = LedgerEntrySerializer(ledger_entries, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """
        Get all payments for a specific customer.
        """
        customer = self.get_object()
        payments = Payment.objects.filter(customer=customer).order_by('-payment_date')
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def current_balance(self, request, pk=None):
        """
        Get current balance for a specific customer.
        """
        customer = self.get_object()
        
        # Calculate total credit (amount customer owes)
        total_credit = LedgerEntry.objects.filter(
            customer=customer,
            entry_type='credit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate total debit (amount customer has paid)
        total_debit = LedgerEntry.objects.filter(
            customer=customer,
            entry_type='debit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate total payments
        total_payments = Payment.objects.filter(
            customer=customer
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        current_balance = total_credit - total_debit - total_payments
        
        return Response({
            'customer_id': customer.id,
            'customer_name': customer.name,
            'total_credit': total_credit,
            'total_debit': total_debit,
            'total_payments': total_payments,
            'current_balance': current_balance,
            'balance_type': 'credit' if current_balance > 0 else 'debit' if current_balance < 0 else 'zero'
        })


class LedgerEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing LedgerEntry records.
    
    Provides CRUD operations for ledger entries with filtering capabilities.
    """
    queryset = LedgerEntry.objects.all().order_by('-entry_date', '-created_at')
    serializer_class = LedgerEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter ledger entries by various criteria.
        """
        queryset = super().get_queryset()
        
        # Filter by customer
        customer_id = self.request.query_params.get('customer_id', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # Filter by entry type
        entry_type = self.request.query_params.get('entry_type', None)
        if entry_type:
            queryset = queryset.filter(entry_type=entry_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(entry_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(entry_date__lte=end_date)
        
        # Filter by description
        description = self.request.query_params.get('description', None)
        if description:
            queryset = queryset.filter(description__icontains=description)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Custom create to handle balance updates.
        """
        ledger_entry = serializer.save()
        
        # Log the creation
        logger.info(f"Ledger entry created: {ledger_entry.id} for customer {ledger_entry.customer.name}")
        
        return ledger_entry
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary statistics for ledger entries.
        """
        # Date range filtering
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        queryset = self.get_queryset()
        
        if start_date:
            queryset = queryset.filter(entry_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(entry_date__lte=end_date)
        
        # Calculate summary statistics
        total_credit = queryset.filter(entry_type='credit').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_debit = queryset.filter(entry_type='debit').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_entries = queryset.count()
        
        return Response({
            'total_credit': total_credit,
            'total_debit': total_debit,
            'net_balance': total_credit - total_debit,
            'total_entries': total_entries,
            'average_credit': total_credit / max(queryset.filter(entry_type='credit').count(), 1),
            'average_debit': total_debit / max(queryset.filter(entry_type='debit').count(), 1)
        })


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Payment records.
    
    Provides CRUD operations for payments with filtering capabilities.
    """
    queryset = Payment.objects.all().order_by('-payment_date', '-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter payments by various criteria.
        """
        queryset = super().get_queryset()
        
        # Filter by customer
        customer_id = self.request.query_params.get('customer_id', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # Filter by payment method
        payment_method = self.request.query_params.get('payment_method', None)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Custom create to handle payment processing.
        """
        payment = serializer.save()
        
        # Log the payment
        logger.info(f"Payment created: {payment.id} for customer {payment.customer.name}")
        
        return payment
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary statistics for payments.
        """
        # Date range filtering
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        queryset = self.get_queryset()
        
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)
        
        # Calculate summary statistics
        total_amount = queryset.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_payments = queryset.count()
        
        # Group by payment method
        by_method = queryset.values('payment_method').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Group by status
        by_status = queryset.values('status').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        return Response({
            'total_amount': total_amount,
            'total_payments': total_payments,
            'average_payment': total_amount / max(total_payments, 1),
            'by_payment_method': list(by_method),
            'by_status': list(by_status)
        })


class DashboardView(APIView):
    """
    API view for dashboard statistics.
    
    Provides comprehensive analytics and statistics for the ledger system.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Get dashboard statistics.
        """
        # Calculate date ranges
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Customer statistics
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(is_active=True).count()
        new_customers_week = Customer.objects.filter(
            created_at__date__gte=week_ago
        ).count()
        
        # Ledger statistics
        ledger_today = LedgerEntry.objects.filter(entry_date=today)
        ledger_week = LedgerEntry.objects.filter(entry_date__gte=week_ago)
        ledger_month = LedgerEntry.objects.filter(entry_date__gte=month_ago)
        
        credit_today = ledger_today.filter(entry_type='credit').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        debit_today = ledger_today.filter(entry_type='debit').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        credit_month = ledger_month.filter(entry_type='credit').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        debit_month = ledger_month.filter(entry_type='debit').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Payment statistics
        payments_today = Payment.objects.filter(payment_date=today)
        payments_week = Payment.objects.filter(payment_date__gte=week_ago)
        payments_month = Payment.objects.filter(payment_date__gte=month_ago)
        
        payments_today_total = payments_today.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        payments_month_total = payments_month.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Top customers by balance (owing money)
        top_debtors = Customer.objects.annotate(
            total_credit=Sum('ledgerentry__amount', filter=Q(ledgerentry__entry_type='credit')),
            total_debit=Sum('ledgerentry__amount', filter=Q(ledgerentry__entry_type='debit')),
            total_payments=Sum('payment__amount')
        ).annotate(
            balance=(
                Coalesce('total_credit', 0) - 
                Coalesce('total_debit', 0) - 
                Coalesce('total_payments', 0)
            )
        ).filter(balance__gt=0).order_by('-balance')[:10]
        
        # Recent activity
        recent_ledger_entries = LedgerEntry.objects.all().order_by('-entry_date')[:10]
        recent_payments = Payment.objects.all().order_by('-payment_date')[:10]
        
        # Prepare response data
        data = {
            'customer_stats': {
                'total_customers': total_customers,
                'active_customers': active_customers,
                'new_customers_week': new_customers_week,
                'inactive_customers': total_customers - active_customers
            },
            'ledger_stats': {
                'today': {
                    'credit': credit_today,
                    'debit': debit_today,
                    'net': credit_today - debit_today,
                    'entries': ledger_today.count()
                },
                'this_month': {
                    'credit': credit_month,
                    'debit': debit_month,
                    'net': credit_month - debit_month,
                    'entries': ledger_month.count()
                }
            },
            'payment_stats': {
                'today': {
                    'total': payments_today_total,
                    'count': payments_today.count()
                },
                'this_month': {
                    'total': payments_month_total,
                    'count': payments_month.count()
                }
            },
            'top_debtors': [
                {
                    'id': customer.id,
                    'name': customer.name,
                    'phone': customer.phone_number,
                    'balance': customer.balance,
                    'last_transaction': customer.ledgerentry_set.order_by('-entry_date').first().entry_date if customer.ledgerentry_set.exists() else None
                }
                for customer in top_debtors
            ],
            'recent_activity': {
                'ledger_entries': LedgerEntrySerializer(recent_ledger_entries, many=True).data,
                'payments': PaymentSerializer(recent_payments, many=True).data
            }
        }
        
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class CustomerBalanceView(APIView):
    """
    API view for customer balance information.
    
    Provides detailed balance information for individual customers.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, customer_id=None):
        """
        Get balance information for a specific customer or all customers.
        """
        if customer_id:
            # Get balance for specific customer
            try:
                customer = Customer.objects.get(id=customer_id)
            except Customer.DoesNotExist:
                return Response(
                    {'error': 'Customer not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return self._get_customer_balance(customer)
        else:
            # Get balances for all customers
            return self._get_all_customers_balance()
    
    def _get_customer_balance(self, customer):
        """
        Calculate and return balance for a single customer.
        """
        # Calculate total credit (amount customer owes)
        total_credit = LedgerEntry.objects.filter(
            customer=customer,
            entry_type='credit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate total debit (amount customer has paid via ledger)
        total_debit = LedgerEntry.objects.filter(
            customer=customer,
            entry_type='debit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Calculate total payments
        total_payments = Payment.objects.filter(
            customer=customer
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        current_balance = total_credit - total_debit - total_payments
        
        # Get recent transactions
        recent_ledger_entries = LedgerEntry.objects.filter(
            customer=customer
        ).order_by('-entry_date')[:10]
        
        recent_payments = Payment.objects.filter(
            customer=customer
        ).order_by('-payment_date')[:10]
        
        data = {
            'customer': {
                'id': customer.id,
                'name': customer.name,
                'phone_number': customer.phone_number,
                'email': customer.email,
                'address': customer.address,
                'is_active': customer.is_active
            },
            'balance_summary': {
                'total_credit': total_credit,
                'total_debit': total_debit,
                'total_payments': total_payments,
                'current_balance': current_balance,
                'balance_type': 'credit' if current_balance > 0 else 'debit' if current_balance < 0 else 'zero'
            },
            'recent_transactions': {
                'ledger_entries': LedgerEntrySerializer(recent_ledger_entries, many=True).data,
                'payments': PaymentSerializer(recent_payments, many=True).data
            }
        }
        
        serializer = CustomerBalanceSerializer(data)
        return Response(serializer.data)
    
    def _get_all_customers_balance(self):
        """
        Calculate and return balances for all customers.
        """
        # Get all customers with their balances
        customers = Customer.objects.all()
        
        customer_balances = []
        
        for customer in customers:
            # Calculate balance for each customer
            total_credit = LedgerEntry.objects.filter(
                customer=customer,
                entry_type='credit'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            total_debit = LedgerEntry.objects.filter(
                customer=customer,
                entry_type='debit'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            total_payments = Payment.objects.filter(
                customer=customer
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            current_balance = total_credit - total_debit - total_payments
            
            customer_balances.append({
                'customer_id': customer.id,
                'customer_name': customer.name,
                'phone_number': customer.phone_number,
                'total_credit': total_credit,
                'total_debit': total_debit,
                'total_payments': total_payments,
                'current_balance': current_balance,
                'balance_type': 'credit' if current_balance > 0 else 'debit' if current_balance < 0 else 'zero',
                'last_transaction_date': customer.ledgerentry_set.order_by('-entry_date').first().entry_date if customer.ledgerentry_set.exists() else None
            })
        
        # Sort by balance (highest debt first)
        customer_balances.sort(key=lambda x: x['current_balance'], reverse=True)
        
        # Calculate summary statistics
        total_balance = sum(item['current_balance'] for item in customer_balances)
        total_credit = sum(item['total_credit'] for item in customer_balances)
        total_debit = sum(item['total_debit'] for item in customer_balances)
        total_payments = sum(item['total_payments'] for item in customer_balances)
        
        # Count by balance type
        credit_count = sum(1 for item in customer_balances if item['balance_type'] == 'credit')
        debit_count = sum(1 for item in customer_balances if item['balance_type'] == 'debit')
        zero_count = sum(1 for item in customer_balances if item['balance_type'] == 'zero')
        
        response_data = {
            'summary': {
                'total_customers': len(customer_balances),
                'total_balance': total_balance,
                'total_credit': total_credit,
                'total_debit': total_debit,
                'total_payments': total_payments,
                'credit_customers': credit_count,
                'debit_customers': debit_count,
                'zero_balance_customers': zero_count
            },
            'customers': customer_balances
        }
        
        return Response(response_data)


# Helper function for Coalesce (since Django's Coalesce might not be available in all contexts)
def Coalesce(field, default=0):
    """
    Simple coalesce function to handle None values.
    """
    return field if field is not None else default