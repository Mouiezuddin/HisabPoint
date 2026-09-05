"""Business profile views."""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import BusinessProfile
from .serializers import BusinessProfileSerializer
from .services import get_or_create_business_profile


class BusinessProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/business/profile/ — view and update own business profile."""

    serializer_class = BusinessProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return get_or_create_business_profile(self.request.user)
