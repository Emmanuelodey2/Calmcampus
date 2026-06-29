from django.contrib import admin
from .models import (
    AIContext,
    Appointment,
    ChatMessage,
    CrisisAlert,
    DirectMessage,
    JournalEntry,
    MoodEntry,
    Resource,
)


# ─── Mood Entry ────────────────────────────────────────────────────────────

@admin.register(MoodEntry)
class MoodEntryAdmin(admin.ModelAdmin):
    list_display   = ("user", "institution", "mood", "intensity", "created_at")
    list_filter    = ("mood", "institution", "created_at")
    search_fields  = ("user__email", "mood")
    readonly_fields = ("created_at",)


# ─── Journal Entry ───────────────────────────────────────────────────────────

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display   = ("user", "institution", "title", "created_at")
    list_filter    = ("institution", "created_at")
    search_fields  = ("user__email", "title")
    readonly_fields = ("created_at", "updated_at")


# ─── Chat Message ─────────────────────────────────────────────────────────────

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display   = ("user", "institution", "sender", "created_at")
    list_filter    = ("sender", "institution", "created_at")
    search_fields  = ("user__email", "message")
    readonly_fields = ("created_at",)


# ─── Crisis Alert ─────────────────────────────────────────────────────────────

@admin.register(CrisisAlert)
class CrisisAlertAdmin(admin.ModelAdmin):
    list_display   = ("user", "institution", "trigger", "source", "status", "created_at")
    list_filter    = ("status", "source", "institution", "created_at")
    search_fields  = ("user__email", "trigger")
    readonly_fields = ("created_at", "updated_at")


# ─── Appointment ──────────────────────────────────────────────────────────────

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display   = ("student", "counsellor", "institution", "status", "requested_for")
    list_filter    = ("status", "institution", "requested_for")
    search_fields  = ("student__email", "counsellor__email")
    readonly_fields = ("created_at", "updated_at")


# ─── Direct Message ───────────────────────────────────────────────────────────

@admin.register(DirectMessage)
class DirectMessageAdmin(admin.ModelAdmin):
    list_display   = ("sender", "recipient", "institution", "read_at", "created_at")
    list_filter    = ("institution", "created_at")
    search_fields  = ("sender__email", "recipient__email")
    readonly_fields = ("created_at",)


# ─── Resource ─────────────────────────────────────────────────────────────────

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display   = ("title", "institution", "category", "created_at")
    list_filter    = ("category", "institution", "created_at")
    search_fields  = ("title",)
    readonly_fields = ("created_at",)


# ─── AI Context ───────────────────────────────────────────────────────────────

@admin.register(AIContext)
class AIContextAdmin(admin.ModelAdmin):
    list_display   = ("user", "institution", "last_mood", "updated_at")
    list_filter    = ("institution",)
    search_fields  = ("user__email",)
    readonly_fields = ("updated_at",)


