"""One-time management command to promote a user to superuser/staff."""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Promote a user to superuser by email"

    def add_arguments(self, parser):
        parser.add_argument("email", type=str, help="Email of the user to promote")

    def handle(self, *args, **options):
        email = options["email"]
        try:
            user = User.objects.get(email=email)
            user.is_staff = True
            user.is_superuser = True
            user.save(update_fields=["is_staff", "is_superuser"])
            self.stdout.write(self.style.SUCCESS(f"✅ User '{email}' promoted to superuser."))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"❌ User '{email}' not found."))
