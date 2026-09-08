"""Authentication views — HttpOnly cookies, 2FA, Email verification, Rate throttling."""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from .serializers import (
    RegisterSerializer,
    UserProfileSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
)
from .totp import (
    generate_totp_secret,
    get_totp_token,
    verify_totp_token,
    generate_recovery_codes,
)
from businesses.services import get_or_create_business_profile

User = get_user_model()


# ── Rate Throttling Classes ───────────────────────────────────────────────
class AuthRateThrottle(AnonRateThrottle):
    rate = "10/minute"
    scope = "auth"


class LoginRateThrottle(AnonRateThrottle):
    rate = "5/minute"
    scope = "login"


class TwoFactorRateThrottle(AnonRateThrottle):
    rate = "5/minute"
    scope = "two_factor"


class PasswordResetRateThrottle(AnonRateThrottle):
    rate = "5/minute"
    scope = "password_reset"


class EmailVerificationRateThrottle(UserRateThrottle):
    rate = "3/minute"
    scope = "email_verify"


# ── Cookie Helper Functions ───────────────────────────────────────────────
def set_jwt_cookies(response, access_token, refresh_token=None):
    """Attach access and refresh tokens as HttpOnly, Secure, SameSite cookies."""
    secure = not settings.DEBUG
    samesite = "None" if secure else "Lax"

    access_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME")
    max_age_access = int(access_lifetime.total_seconds()) if access_lifetime else 900

    response.set_cookie(
        key="access_token",
        value=str(access_token),
        max_age=max_age_access,
        httponly=True,
        secure=secure,
        samesite=samesite,
        path="/",
    )

    if refresh_token:
        refresh_lifetime = settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME")
        max_age_refresh = int(refresh_lifetime.total_seconds()) if refresh_lifetime else 604800
        response.set_cookie(
            key="refresh_token",
            value=str(refresh_token),
            max_age=max_age_refresh,
            httponly=True,
            secure=secure,
            samesite=samesite,
            path="/",
        )
    return response


def clear_jwt_cookies(response):
    """Remove authentication cookies."""
    secure = not settings.DEBUG
    samesite = "None" if secure else "Lax"
    response.delete_cookie("access_token", path="/", samesite=samesite)
    response.delete_cookie("refresh_token", path="/", samesite=samesite)
    return response


# ── Authentication Views ──────────────────────────────────────────────────
class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create account + business profile."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        get_or_create_business_profile(user)

        refresh = RefreshToken.for_user(user)
        res = Response(
            {
                "message": "Account created successfully.",
                "user": UserProfileSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )
        return set_jwt_cookies(res, refresh.access_token, refresh)


class CustomTokenObtainPairView(TokenObtainPairView):
    """POST /api/auth/login/ — returns access + refresh tokens and sets HttpOnly cookies."""

    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {"message": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = serializer.user

        # If user has 2FA enabled, issue a temporary pre-auth challenge token
        if user.is_2fa_enabled:
            pre_auth_token = RefreshToken.for_user(user)
            pre_auth_token["2fa_pending"] = True
            return Response(
                {
                    "message": "2FA verification required.",
                    "2fa_required": True,
                    "pre_auth_token": str(pre_auth_token.access_token),
                },
                status=status.HTTP_200_OK,
            )

        refresh = serializer.validated_data.get("refresh")
        access = serializer.validated_data.get("access")

        response = Response(
            {
                "message": "Login successful.",
                "user": UserProfileSerializer(user).data,
                "access": access,
                "refresh": refresh,
            },
            status=status.HTTP_200_OK,
        )
        return set_jwt_cookies(response, access, refresh)


@api_view(["POST"])
@permission_classes([AllowAny])
def cookie_refresh_token_view(request):
    """POST /api/auth/token/refresh/ — refreshes access token using cookie or payload."""
    refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh")
    if not refresh_token:
        return Response({"message": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        token = RefreshToken(refresh_token)
        new_access = str(token.access_token)
        res = Response({"access": new_access, "refresh": str(refresh_token)})
        return set_jwt_cookies(res, new_access, refresh_token)
    except Exception:
        res = Response({"message": "Token is invalid or expired."}, status=status.HTTP_401_UNAUTHORIZED)
        return clear_jwt_cookies(res)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """POST /api/auth/logout/ — blacklist refresh token and clear cookies."""
    refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh")
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass

    response = Response({"message": "Logged out successfully."})
    return clear_jwt_cookies(response)


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/profile/ — view and update own profile."""

    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """POST /api/auth/change-password/"""
    serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"message": "Password changed successfully."})


# ── Password Reset Views ──────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRateThrottle])
def password_reset_request_view(request):
    """POST /api/auth/password-reset/ — send reset email."""
    email = request.data.get("email", "").strip()
    if not email:
        return Response({"message": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.CORS_ALLOWED_ORIGINS[0]}/reset-password/{uid}/{token}/"
        send_mail(
            subject="Digital Ledger — Password Reset",
            message=(
                f"Hello {user.name},\n\n"
                f"Click the link below to reset your password:\n{reset_url}\n\n"
                "This link expires in 24 hours.\n\nIf you did not request this, ignore this email."
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass  # User enumeration protection

    return Response(
        {"message": "If that email is registered, a reset link has been sent."}
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRateThrottle])
def password_reset_confirm_view(request):
    """POST /api/auth/password-reset-confirm/ — set new password."""
    uid = request.data.get("uid", "")
    token = request.data.get("token", "")
    new_password = request.data.get("new_password", "")

    if not all([uid, token, new_password]):
        return Response(
            {"message": "uid, token, and new_password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, User.DoesNotExist):
        return Response({"message": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response(
            {"message": "Reset link is invalid or has expired."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(new_password, user=user)
    except ValidationError as e:
        return Response(
            {"message": e.messages[0], "errors": {"new_password": e.messages}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()
    return Response({"message": "Password reset successful. Please log in."})


# ── Two-Factor Authentication (2FA) Views ──────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def setup_2fa_view(request):
    """POST /api/auth/2fa/setup/ — generate secret & otpauth URL."""
    user = request.user
    if user.is_2fa_enabled:
        return Response({"message": "2FA is already enabled."}, status=status.HTTP_400_BAD_REQUEST)

    secret = generate_totp_secret()
    user.totp_secret = secret
    user.save(update_fields=["totp_secret"])

    otpauth_url = f"otpauth://totp/HisabPoint:{user.email}?secret={secret}&issuer=HisabPoint"

    return Response({
        "secret": secret,
        "otpauth_url": otpauth_url,
        "message": "Scan QR code or enter secret in your authenticator app, then confirm with code."
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([TwoFactorRateThrottle])
def confirm_2fa_view(request):
    """POST /api/auth/2fa/confirm/ — verify code and generate recovery codes."""
    user = request.user
    code = request.data.get("code", "").strip()

    if not user.totp_secret:
        return Response({"message": "Run 2FA setup first."}, status=status.HTTP_400_BAD_REQUEST)

    if not verify_totp_token(user.totp_secret, code):
        return Response({"message": "Invalid 2FA code."}, status=status.HTTP_400_BAD_REQUEST)

    recovery_codes = generate_recovery_codes(8)
    user.is_2fa_enabled = True
    user.recovery_codes = recovery_codes
    user.save(update_fields=["is_2fa_enabled", "recovery_codes"])

    return Response({
        "message": "2FA enabled successfully.",
        "recovery_codes": recovery_codes,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([TwoFactorRateThrottle])
def verify_2fa_view(request):
    """POST /api/auth/2fa/verify/ — verify 2FA challenge code during login."""
    pre_auth_token = request.data.get("pre_auth_token", "")
    code = request.data.get("code", "").strip().upper()

    if not pre_auth_token or not code:
        return Response({"message": "pre_auth_token and code are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validated_token = AccessToken(pre_auth_token)
        user_id = validated_token["user_id"]
        user = User.objects.get(pk=user_id)
    except Exception:
        return Response({"message": "Invalid or expired pre-auth token."}, status=status.HTTP_401_UNAUTHORIZED)

    is_valid = verify_totp_token(user.totp_secret, code)

    # Check recovery code fallback
    if not is_valid and code in user.recovery_codes:
        is_valid = True
        user.recovery_codes.remove(code)
        user.save(update_fields=["recovery_codes"])

    if not is_valid:
        return Response({"message": "Invalid 2FA code or recovery code."}, status=status.HTTP_400_BAD_REQUEST)

    refresh = RefreshToken.for_user(user)
    response = Response(
        {
            "message": "2FA verification successful.",
            "user": UserProfileSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        },
        status=status.HTTP_200_OK,
    )
    return set_jwt_cookies(response, refresh.access_token, refresh)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def disable_2fa_view(request):
    """POST /api/auth/2fa/disable/ — disable 2FA with current password."""
    user = request.user
    password = request.data.get("password", "")

    if not user.check_password(password):
        return Response({"message": "Current password is required to disable 2FA."}, status=status.HTTP_400_BAD_REQUEST)

    user.is_2fa_enabled = False
    user.totp_secret = ""
    user.recovery_codes = []
    user.save(update_fields=["is_2fa_enabled", "totp_secret", "recovery_codes"])

    return Response({"message": "2FA disabled successfully."})


# ── Email Verification Views ─────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([EmailVerificationRateThrottle])
def send_email_verification_view(request):
    """POST /api/auth/email/send-verification/ — send email verification link."""
    user = request.user
    if user.is_email_verified:
        return Response({"message": "Email is already verified."}, status=status.HTTP_400_BAD_REQUEST)

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    verify_url = f"{settings.CORS_ALLOWED_ORIGINS[0]}/verify-email/{uid}/{token}/"

    send_mail(
        subject="Digital Ledger — Verify Email Address",
        message=(
            f"Hello {user.name},\n\n"
            f"Please click the link below to verify your email address:\n{verify_url}\n\n"
            "This link expires in 24 hours."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return Response({"message": "Verification link sent to your email address."})


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email_view(request):
    """POST /api/auth/email/verify/ — complete email verification."""
    uid = request.data.get("uid", "")
    token = request.data.get("token", "")

    if not uid or not token:
        return Response({"message": "uid and token are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, User.DoesNotExist):
        return Response({"message": "Invalid verification link."}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({"message": "Verification link is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

    user.is_email_verified = True
    user.save(update_fields=["is_email_verified"])

    return Response({"message": "Email address verified successfully."})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AuthRateThrottle])
def google_auth_view(request):
    """POST /api/auth/google/ — authenticate or register user via Google OAuth ID Token."""
    token = request.data.get("token")
    if not token:
        return Response({"error": "Google ID token is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        client_id = getattr(
            settings,
            "GOOGLE_CLIENT_ID",
            "936456474682-ilijsok5msld8s17jdiccrddshfuimu0.apps.googleusercontent.com",
        )
        id_info = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)

        email = id_info.get("email")
        if not email:
            return Response(
                {"error": "Google account does not have an email address associated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = email.lower().strip()
        name = id_info.get("name") or email.split("@")[0]

        # Find or create user
        user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.create(
                email=email,
                name=name,
                is_email_verified=True,
            )
            user.set_unusable_password()
            user.save()
            get_or_create_business_profile(user)
        else:
            if not user.is_email_verified:
                user.is_email_verified = True
                user.save(update_fields=["is_email_verified"])
            get_or_create_business_profile(user)

        refresh = RefreshToken.for_user(user)
        resp_data = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserProfileSerializer(user).data,
            "message": "Google authentication successful.",
        }
        res = Response(resp_data, status=status.HTTP_200_OK)
        return set_jwt_cookies(res, refresh.access_token, refresh)

    except ValueError as e:
        return Response({"error": f"Invalid or expired Google token: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": f"Google authentication failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
