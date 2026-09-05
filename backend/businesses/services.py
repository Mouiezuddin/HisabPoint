"""Business profile service functions."""
from .models import BusinessProfile


def get_or_create_business_profile(user):
    """Ensure a business profile exists for the user. Called on registration."""
    profile, _ = BusinessProfile.objects.get_or_create(
        user=user,
        defaults={
            "shop_name": "My Shop",
            "owner_name": user.name,
            "phone": user.phone,
        },
    )
    return profile
