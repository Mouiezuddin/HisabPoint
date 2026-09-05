# pyrefly: ignore [missing-import]
from django.contrib import admin
# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
from django.conf.urls.static import static

# pyrefly: ignore [missing-import]
from common.views import api_root_view

urlpatterns = [
    path("", api_root_view, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/business/", include("businesses.urls")),
    path("api/customers/", include("customers.urls")),
    path("api/transactions/", include("ledger.urls")),
    path("api/dashboard/", include("reports.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
