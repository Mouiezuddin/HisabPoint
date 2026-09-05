"""Common permissions shared across apps."""
from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Allow access only if the object's user field matches the requesting user.
    Works for objects with a `user` or `created_by` field.
    """

    def has_object_permission(self, request, view, obj):
        # Support both direct user ownership and created_by patterns
        if hasattr(obj, "user"):
            return obj.user == request.user
        if hasattr(obj, "created_by"):
            return obj.created_by == request.user
        return False


class IsAdminUser(permissions.BasePermission):
    """
    Allow access only to authenticated admin users (is_staff or is_superuser).
    Enforces server-side admin check.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )
