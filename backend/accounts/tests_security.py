"""Comprehensive Security & Authentication Hardening Tests."""
from typing import Any, cast
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from accounts.totp import get_totp_token

User: Any = get_user_model()


@patch("accounts.views.LoginRateThrottle.allow_request", return_value=True)
@patch("accounts.views.AuthRateThrottle.allow_request", return_value=True)
@patch("accounts.views.PasswordResetRateThrottle.allow_request", return_value=True)
class AuthenticationSecurityTestCase(APITestCase):
    def setUp(self):
        self.password = "StrongPass123!"
        self.user = User.objects.create_user(
            email="secuser@test.com",
            name="Normal User",
            password=self.password,
        )
        self.admin = User.objects.create_user(
            email="secadmin@test.com",
            name="Admin User",
            password=self.password,
            is_staff=True,
        )

    # ── 1. HttpOnly Cookie & Session Tests ─────────────────────────
    def test_login_sets_httponly_cookies(self, *args: Any):
        client = cast(APIClient, self.client)
        res: Any = client.post(
            "/api/auth/login/",
            {"email": self.user.email, "password": self.password},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", res.cookies)
        self.assertIn("refresh_token", res.cookies)
        self.assertTrue(res.cookies["access_token"]["httponly"])
        self.assertTrue(res.cookies["refresh_token"]["httponly"])

    def test_authenticated_request_via_httponly_cookie(self, *args: Any):
        client = cast(APIClient, self.client)
        login_res: Any = client.post(
            "/api/auth/login/",
            {"email": self.user.email, "password": self.password},
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        access_cookie = login_res.cookies["access_token"].value

        # Clear authorization headers and rely on HttpOnly cookie
        client.cookies["access_token"] = access_cookie
        profile_res: Any = client.get("/api/auth/profile/")
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.json()["email"], self.user.email)

    def test_logout_clears_cookies(self, *args: Any):
        client = cast(APIClient, self.client)
        login_res: Any = client.post(
            "/api/auth/login/",
            {"email": self.user.email, "password": self.password},
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        client.cookies["access_token"] = login_res.cookies["access_token"].value
        client.cookies["refresh_token"] = login_res.cookies["refresh_token"].value

        logout_res: Any = client.post("/api/auth/logout/")
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)
        # Cookies should be cleared/expired
        self.assertEqual(logout_res.cookies["access_token"].value, "")

    # ── 2. Two-Factor Authentication (2FA) Tests ─────────────────
    def test_2fa_full_lifecycle(self, *args: Any):
        client = cast(APIClient, self.client)
        client.force_authenticate(user=self.user)

        # Step A: Setup 2FA
        setup_res: Any = client.post("/api/auth/2fa/setup/")
        self.assertEqual(setup_res.status_code, status.HTTP_200_OK)
        data = setup_res.json()
        secret = data["secret"]
        self.assertTrue(secret)

        # Step B: Confirm 2FA with valid TOTP token
        totp_code = get_totp_token(secret)
        confirm_res: Any = client.post("/api/auth/2fa/confirm/", {"code": totp_code})
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)
        recovery_codes = confirm_res.json()["recovery_codes"]
        self.assertEqual(len(recovery_codes), 8)

        self.user.refresh_from_db()
        self.assertTrue(self.user.is_2fa_enabled)

        # Step C: Login challenge triggers 2FA challenge
        client.force_authenticate(user=None)
        login_res: Any = client.post(
            "/api/auth/login/",
            {"email": self.user.email, "password": self.password},
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        login_data = login_res.json()
        self.assertTrue(login_data.get("2fa_required"))
        pre_auth_token = login_data["pre_auth_token"]

        # Step D: Complete 2FA verification challenge using OTP code
        current_otp = get_totp_token(secret)
        verify_res: Any = client.post(
            "/api/auth/2fa/verify/",
            {"pre_auth_token": pre_auth_token, "code": current_otp},
        )
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", verify_res.cookies)

        # Step E: Disable 2FA with password
        client.force_authenticate(user=self.user)
        disable_res: Any = client.post(
            "/api/auth/2fa/disable/",
            {"password": self.password},
        )
        self.assertEqual(disable_res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_2fa_enabled)

    # ── 3. Email Verification Tests ────────────────────────────────
    def test_email_verification_flow(self, *args: Any):
        client = cast(APIClient, self.client)
        client.force_authenticate(user=self.user)
        self.assertFalse(self.user.is_email_verified)

        # Request verification token
        send_res: Any = client.post("/api/auth/email/send-verification/")
        self.assertEqual(send_res.status_code, status.HTTP_200_OK)

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        # Complete email verification
        client.force_authenticate(user=None)
        verify_res: Any = client.post(
            "/api/auth/email/verify/",
            {"uid": uid, "token": token},
        )
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_email_verified)

    # ── 4. Server-Side Admin RBAC & Direct API Tests ───────────────
    def test_normal_user_denied_admin_endpoints(self, *args: Any):
        client = cast(APIClient, self.client)
        client.force_authenticate(user=self.user)

        res_users: Any = client.get("/api/auth/admin/users/")
        self.assertEqual(res_users.status_code, status.HTTP_403_FORBIDDEN)

        res_stats: Any = client.get("/api/auth/admin/stats/")
        self.assertEqual(res_stats.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_user_allowed_admin_endpoints(self, *args: Any):
        client = cast(APIClient, self.client)
        client.force_authenticate(user=self.admin)

        res_users: Any = client.get("/api/auth/admin/users/")
        self.assertEqual(res_users.status_code, status.HTTP_200_OK)

        res_stats: Any = client.get("/api/auth/admin/stats/")
        self.assertEqual(res_stats.status_code, status.HTTP_200_OK)
        self.assertIn("total_users", res_stats.json())
