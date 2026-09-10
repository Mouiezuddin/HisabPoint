# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from django.conf.urls.static import static

# pyrefly: ignore [missing-import]
from common.views import api_root_view, health_check_view


def sentry_debug_error(request):
    """Debug view to verify Sentry error monitoring."""
    division_by_zero = 1 / 0
    return division_by_zero


urlpatterns = [
    path("sentry-debug/", sentry_debug_error, name="sentry-debug"),
    path("", api_root_view, name="api-root"),
    path("api/health/", health_check_view, name="health-check"),
    path("health/", health_check_view, name="health-check-short"),
    path("admin/", admin.site.urls),
    # Standard endpoints with /api/ prefix
    path("api/auth/", include("accounts.urls")),
    path("api/business/", include("businesses.urls")),
    path("api/customers/", include("customers.urls")),
    path("api/transactions/", include("ledger.urls")),
    path("api/dashboard/", include("reports.urls")),
    # Direct fallback endpoints without /api/ prefix
    path("auth/", include("accounts.urls")),
    path("business/", include("businesses.urls")),
    path("customers/", include("customers.urls")),
    path("transactions/", include("ledger.urls")),
    path("dashboard/", include("reports.urls")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
