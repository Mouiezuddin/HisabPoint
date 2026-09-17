"""Tests for authentication and user accounts."""
from typing import Any, cast
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

User: Any = get_user_model()


class UserRegistrationTestCase(APITestCase):
    def setUp(self):
        self.register_url = "/api/auth/register/"

    def test_registration_success(self):
        client = cast(APIClient, self.client)
        payload = {
            "name": "New Shopkeeper",
            "email": "newshop@test.com",
            "phone": "9876543210",
            "password": "StrongPassword123!",
            "password2": "StrongPassword123!",
        }
        response: Any = client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", response.json())
        self.assertIn("access", response.json())
        self.assertTrue(User.objects.filter(email="newshop@test.com").exists())

    def test_registration_duplicate_email(self):
        client = cast(APIClient, self.client)
        User.objects.create_user(
            email="existing@test.com", name="Existing User", password="Password123!"
        )
        payload = {
            "name": "Duplicate User",
            "email": "existing@test.com",
            "password": "Password123!",
            "password2": "Password123!",
        }
        response: Any = client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_password_mismatch(self):
        client = cast(APIClient, self.client)
        payload = {
            "name": "Mismatch User",
            "email": "mismatch@test.com",
            "password": "Password123!",
            "password2": "DifferentPassword123!",
        }
        response: Any = client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserLoginTestCase(APITestCase):
    def setUp(self):
        self.password = "ValidPassword123!"
        self.user = User.objects.create_user(
            email="login@test.com", name="Login User", password=self.password
        )
        self.login_url = "/api/auth/login/"

    def test_login_success(self):
        client = cast(APIClient, self.client)
        response: Any = client.post(
            self.login_url, {"email": self.user.email, "password": self.password}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.json())
        self.assertIn("access_token", response.cookies)

    def test_login_invalid_password(self):
        client = cast(APIClient, self.client)
        response: Any = client.post(
            self.login_url, {"email": self.user.email, "password": "WrongPassword!"}
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        data = response.json()
        self.assertEqual(data.get("remaining_attempts"), 4)
        self.assertFalse(data.get("locked"))

    def test_login_lockout_after_five_failed_attempts(self):
        client = cast(APIClient, self.client)

        # First 4 failed attempts should return 401 with decreasing remaining_attempts
        for i in range(1, 5):
            res: Any = client.post(
                self.login_url, {"email": self.user.email, "password": "WrongPassword!"}
            )
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
            data = res.json()
            self.assertEqual(data.get("remaining_attempts"), 5 - i)
            self.assertFalse(data.get("locked"))

        # 5th failed attempt should trigger 429 Too Many Requests with locked=True and 30-min retry_after
        res5: Any = client.post(
            self.login_url, {"email": self.user.email, "password": "WrongPassword!"}
        )
        self.assertEqual(res5.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        data5 = res5.json()
        self.assertTrue(data5.get("locked"))
        self.assertEqual(data5.get("remaining_attempts"), 0)
        self.assertEqual(data5.get("retry_after"), 1800)
        self.assertIn("Retry-After", res5.headers)

        # 6th attempt while locked should also return 429
        res6: Any = client.post(
            self.login_url, {"email": self.user.email, "password": self.password}
        )
        self.assertEqual(res6.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertTrue(res6.json().get("locked"))

    def test_successful_login_resets_failed_attempts(self):
        client = cast(APIClient, self.client)

        # 3 failed attempts
        for _ in range(3):
            client.post(self.login_url, {"email": self.user.email, "password": "WrongPassword!"})

        # Correct password on 4th attempt succeeds
        res: Any = client.post(
            self.login_url, {"email": self.user.email, "password": self.password}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Next failed attempt should reset counter back to 4 remaining attempts
        res_after: Any = client.post(
            self.login_url, {"email": self.user.email, "password": "WrongPassword!"}
        )
        self.assertEqual(res_after.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res_after.json().get("remaining_attempts"), 4)

    def test_profile_authenticated(self):
        client = cast(APIClient, self.client)
        client.force_authenticate(user=self.user)
        response: Any = client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["email"], self.user.email)

    def test_profile_unauthenticated(self):
        client = cast(APIClient, self.client)
        response: Any = client.get("/api/auth/profile/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PasswordResetTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="reset@test.com", name="Reset User", password="ValidPassword123!"
        )

    def test_password_reset_request_existing_email(self):
        client = cast(APIClient, self.client)
        response: Any = client.post("/api/auth/password-reset/", {"email": self.user.email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_password_reset_request_non_existent_email(self):
        client = cast(APIClient, self.client)
        response: Any = client.post("/api/auth/password-reset/", {"email": "nonexistent@test.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_password_reset_confirm_rejects_weak_password(self):
        client = cast(APIClient, self.client)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response: Any = client.post(
            "/api/auth/password-reset-confirm/",
            {"uid": uid, "token": token, "new_password": "123"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("message", response.json())

    def test_password_reset_confirm_accepts_strong_password(self):
        client = cast(APIClient, self.client)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response: Any = client.post(
            "/api/auth/password-reset-confirm/",
            {"uid": uid, "token": token, "new_password": "NewStrongPassword456!"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStrongPassword456!"))

    def test_password_reset_confirm_invalid_token(self):
        client = cast(APIClient, self.client)
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        response: Any = client.post(
            "/api/auth/password-reset-confirm/",
            {"uid": uid, "token": "invalid-token", "new_password": "NewStrongPassword456!"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
