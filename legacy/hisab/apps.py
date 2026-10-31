"""
Django app configuration for Hisab (Ledger) application.
"""

from django.apps import AppConfig


class HisabConfig(AppConfig):
    """
    Configuration for the Hisab (Ledger) Django application.
    """
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hisab'
    verbose_name = 'Hisab (Ledger) Management'
    
    def ready(self):
        """
        App initialization code.
        
        This method is called when the app is ready. Use it to import
        signals, connect receivers, or perform other initialization tasks.
        """
        # Import signals to ensure they are registered
        try:
            import hisab.signals  # noqa: F401
        except ImportError:
            pass