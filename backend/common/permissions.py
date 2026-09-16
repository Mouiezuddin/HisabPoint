"""Common permissions shared across apps."""
from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Allow access only if the object's user field matches the requesting user.
    Works for objects with a `user` or `created_by` field.
    """

    # pyrefly: ignore [inconsistent-override]
    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        # Support both direct user ownership and created_by patterns
        if hasattr(obj, "user"):
            return bool(obj.user == request.user)
        if hasattr(obj, "created_by"):
            return bool(obj.created_by == request.user)
        return False


class IsAdminUser(permissions.BasePermission):
    """
    Allow access only to authenticated admin users (is_staff or is_superuser).
    Enforces server-side admin check.
    """

    # pyrefly: ignore [inconsistent-override]
    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )
