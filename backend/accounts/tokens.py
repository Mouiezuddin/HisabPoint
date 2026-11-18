"""Custom token types for authentication flows."""
from datetime import timedelta
from rest_framework_simplejwt.tokens import Token


class PreAuthToken(Token):
    """
    Temporary token issued during login when 2FA is required.
    Strictly scoped to 2FA challenge verification and cannot be used
    as a general API access token.
    """
    token_type = "pre_auth"
    lifetime = timedelta(minutes=5)

