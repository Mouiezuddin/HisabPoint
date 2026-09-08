"""URL patterns for authentication, 2FA, email verification, and admin management."""
from django.urls import path

from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    cookie_refresh_token_view,
    logout_view,
    ProfileView,
    change_password_view,
    password_reset_request_view,
    password_reset_confirm_view,
    setup_2fa_view,
    confirm_2fa_view,
    verify_2fa_view,
    disable_2fa_view,
    send_email_verification_view,
    verify_email_view,
    google_auth_view,
)
from .admin_views import AdminUserListView, admin_stats_view

urlpatterns = [
    # Auth core
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="auth-login"),
    path("google/", google_auth_view, name="auth-google"),
    path("logout/", logout_view, name="auth-logout"),
    path("token/refresh/", cookie_refresh_token_view, name="token-refresh"),
    path("profile/", ProfileView.as_view(), name="auth-profile"),
    path("change-password/", change_password_view, name="auth-change-password"),
    path("password-reset/", password_reset_request_view, name="auth-password-reset"),
    path("password-reset-confirm/", password_reset_confirm_view, name="auth-password-reset-confirm"),

    # Two-Factor Authentication (2FA)
    path("2fa/setup/", setup_2fa_view, name="auth-2fa-setup"),
    path("2fa/confirm/", confirm_2fa_view, name="auth-2fa-confirm"),
    path("2fa/verify/", verify_2fa_view, name="auth-2fa-verify"),
    path("2fa/disable/", disable_2fa_view, name="auth-2fa-disable"),

    # Email Verification
    path("email/send-verification/", send_email_verification_view, name="auth-email-send-verification"),
    path("email/verify/", verify_email_view, name="auth-email-verify"),

    # Admin Management (RBAC)
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("admin/stats/", admin_stats_view, name="admin-stats"),
]
