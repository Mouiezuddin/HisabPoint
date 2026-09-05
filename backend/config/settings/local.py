"""Local development settings — uses SQLite, console email, debug mode."""
from .base import *  # noqa: F401, F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
    }
}

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Relaxed security for local dev
CORS_ALLOW_ALL_ORIGINS = True
