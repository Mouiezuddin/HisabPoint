"""Custom exception handler for consistent API error responses."""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """Return consistent error format: {message, errors}."""
    response = exception_handler(exc, context)

    if response is not None:
        data = response.data

        # Normalize to {message, errors}
        if isinstance(data, dict):
            message = data.pop("detail", None)
            if message is None:
                # Validation errors — find a human-readable summary
                first_field = next(iter(data), None)
                if first_field and isinstance(data.get(first_field), list):
                    message = str(data[first_field][0])
                else:
                    message = "An error occurred. Please check the details."
            response.data = {
                "message": str(message),
                "errors": data if data else {},
            }
        elif isinstance(data, list):
            response.data = {
                "message": str(data[0]) if data else "An error occurred.",
                "errors": {},
            }

    return response
