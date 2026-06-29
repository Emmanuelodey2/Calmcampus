"""
Management command to delete users who signed up but never verified
their email within the allowed time window (default: 1 hour).

Usage:
    python manage.py cleanup_unverified_users
    python manage.py cleanup_unverified_users --hours 2     # custom window
    python manage.py cleanup_unverified_users --dry-run      # preview only
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from auth_app.models import User


class Command(BaseCommand):
    help = "Delete users whose email has not been verified within the given time window."

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours",
            type=float,
            default=1,
            help="Number of hours after signup before an unverified user is deleted (default: 1).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only print what would be deleted, without actually deleting.",
        )

    def handle(self, *args, **options):
        hours = options["hours"]
        dry_run = options["dry_run"]
        cutoff = timezone.now() - timedelta(hours=hours)

        stale_users = User.objects.filter(
            email_verified=False,
            date_joined__lt=cutoff,
        )

        count = stale_users.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS("No unverified users to clean up."))
            return

        if dry_run:
            self.stdout.write(self.style.WARNING(f"[DRY RUN] Would delete {count} unverified user(s):"))
            for user in stale_users:
                self.stdout.write(f"  • {user.email} (joined {user.date_joined})")
        else:
            emails = list(stale_users.values_list("email", flat=True))
            deleted_count, _ = stale_users.delete()
            self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} unverified user(s):"))
            for email in emails:
                self.stdout.write(f"  • {email}")
