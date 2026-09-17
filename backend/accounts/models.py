"""Custom User model using email as the unique login identifier."""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        if not name:
            raise ValueError("Name is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    # pyrefly: ignore [inconsistent-override]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # type: ignore[override]
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True, default="")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_2fa_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=64, blank=True, default="")
    recovery_codes = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects: UserManager = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.name} <{self.email}>"


class LoginAttempt(models.Model):
    """Tracks consecutive failed login attempts and temporary lockouts per email or IP."""
    identifier = models.CharField(max_length=255, unique=True, db_index=True)
    failed_count = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "login_attempts"

    def __str__(self):
        return f"{self.identifier} ({self.failed_count} failed, locked_until={self.locked_until})"
