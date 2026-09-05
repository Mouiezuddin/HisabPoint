"""Business Profile model."""
import uuid
from django.db import models
from django.conf import settings


class BusinessProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="business_profile",
    )
    shop_name = models.CharField(max_length=200, blank=True, default="My Shop")
    owner_name = models.CharField(max_length=150, blank=True, default="")
    address = models.TextField(blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    logo = models.ImageField(upload_to="logos/", blank=True, null=True)
    gstin = models.CharField(max_length=15, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "business_profiles"

    def __str__(self):
        return f"{self.shop_name} ({self.user.email})"
