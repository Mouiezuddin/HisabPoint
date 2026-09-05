"""Custom JWT Authentication class reading tokens from HttpOnly cookies."""
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """
    Extract JWT access token from HttpOnly cookie first,
    falling back to Authorization Bearer header if not found in cookie.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token

        # Fallback to HttpOnly cookie
        raw_cookie = request.COOKIES.get(getattr(settings, "SIMPLE_JWT_COOKIE_NAME", "access_token"))
        if raw_cookie:
            try:
                validated_token = self.get_validated_token(raw_cookie)
                return self.get_user(validated_token), validated_token
            except Exception:
                return None

        return None
