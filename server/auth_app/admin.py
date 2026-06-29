from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Institution, User


# ─── Institution ──────────────────────────────────────────────────────────────

@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display  = ("name", "slug", "is_active", "created_at")
    list_filter   = ("is_active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


# ─── User ─────────────────────────────────────────────────────────────────────

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ("email", "role", "institution", "is_active", "is_staff", "is_superuser")
    list_filter   = ("role", "institution", "is_active", "is_staff", "is_superuser")
    search_fields = ("email",)
    ordering      = ("email",)

    fieldsets = (
        (None,            {"fields": ("email", "password")}),
        ("Role & Institution", {"fields": ("role", "institution", "assigned_counsellor")}),
        ("Personal info", {"fields": ("phone", "address", "city")}),
        ("Permissions",   {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "role", "institution", "is_staff", "is_superuser"),
        }),
    )
