"""WSGI config."""
import os
import logging
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
application = get_wsgi_application()

# Autonomous database migration ensure on production startup
try:
    from django.core.management import call_command
    call_command("migrate", interactive=False)
except Exception as e:
    logging.getLogger("django").error(f"WSGI startup migration notice: {e}")

