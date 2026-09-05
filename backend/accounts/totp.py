"""Pure Python RFC 6238 TOTP and recovery code generator/validator."""
import base64
import hashlib
import hmac
import os
import secrets
import struct
import time


def generate_totp_secret() -> str:
    """Generate a random 20-byte base32 TOTP secret."""
    raw_bytes = os.urandom(20)
    return base64.b32encode(raw_bytes).decode("ascii").replace("=", "")


def get_totp_token(secret: str, time_step: int = 30, for_time: float = None) -> str:
    """Calculate the 6-digit TOTP code for a given base32 secret and timestamp."""
    if for_time is None:
        for_time = time.time()

    # Ensure secret is padded to multiple of 8 for base32 decoding
    secret_padded = secret + "=" * ((8 - len(secret) % 8) % 8)
    key = base64.b32decode(secret_padded, casefold=True)

    counter = int(for_time // time_step)
    msg = struct.pack(">Q", counter)

    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[19] & 0x0F
    code = (
        (digest[offset] & 0x7F) << 24
        | (digest[offset + 1] & 0xFF) << 16
        | (digest[offset + 2] & 0xFF) << 8
        | (digest[offset + 3] & 0xFF)
    ) % 1000000

    return f"{code:06d}"


def verify_totp_token(secret: str, token: str, window: int = 1) -> bool:
    """
    Verify a TOTP token against secret, allowing for time drift (window * 30s).
    """
    if not secret or not token:
        return False

    token = token.strip()
    if not token.isdigit() or len(token) != 6:
        return False

    now = time.time()
    for i in range(-window, window + 1):
        test_time = now + (i * 30)
        if get_totp_token(secret, for_time=test_time) == token:
            return True
    return False


def generate_recovery_codes(count: int = 8) -> list[str]:
    """Generate a list of formatted 8-character recovery codes."""
    codes = []
    for _ in range(count):
        code = secrets.token_hex(4).upper()
        formatted = f"{code[:4]}-{code[4:]}"
        codes.append(formatted)
    return codes
