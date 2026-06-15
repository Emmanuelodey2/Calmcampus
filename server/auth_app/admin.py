from dashboard.models import MoodEntry, JournalEntry, AIContext, ChatMessage
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

class UserAdmin(BaseUserAdmin):
    # fields to display in the list
    list_display = ("email", "is_staff", "is_superuser", "is_active")
    list_filter = ("is_staff", "is_superuser", "is_active")

    # fields to edit when opening a user
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("phone", "address", "city")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    # fields when creating a new user in the admin
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "is_staff", "is_superuser"),
        }),
    )

    search_fields = ("email",)
    ordering = ("email",)


# Custom admin for MoodEntry
class MoodEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "mood", "intensity", "created_at")  # Fields to display in the list view
    list_filter = ("mood", "created_at")  # Filters for easier navigation
    search_fields = ("user__email", "mood")  # Search by user email or mood


# Custom admin for JournalEntry
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ("user", "id","title","content", "created_at")  # Fields to display in the list view
    list_filter = ("created_at",)  # Filters for easier navigation
    search_fields = ("user__email", "title")  # Search by user email or title


# Register custom user, mood entry, and journal entry
admin.site.register(User, UserAdmin)
admin.site.register(MoodEntry, MoodEntryAdmin)
admin.site.register(JournalEntry, JournalEntryAdmin)