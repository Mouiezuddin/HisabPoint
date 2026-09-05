"""Business profile serializer."""
from rest_framework import serializers
from .models import BusinessProfile


class BusinessProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessProfile
        fields = [
            "id",
            "shop_name",
            "owner_name",
            "address",
            "phone",
            "logo",
            "gstin",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_logo(self, value):
        if value:
            # Check file size (max 5MB)
            max_size = 5 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError("Logo image file size must be less than 5MB.")

            # Check file extension
            import os
            ext = os.path.splitext(value.name)[1].lower()
            allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
            if ext not in allowed_extensions:
                raise serializers.ValidationError("Logo must be a valid image (.jpg, .jpeg, .png, .webp).")
        return value
