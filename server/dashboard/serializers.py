from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import (
    Appointment,
    ChatMessage,
    CrisisAlert,
    DirectMessage,
    JournalEntry,
    MoodEntry,
    Resource,
)
from auth_app.models import Institution

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source="institution.name", read_only=True)
    institution_slug = serializers.CharField(source="institution.slug", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "role", "institution", "institution_name", "institution_slug", "is_active"]


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ["id", "name", "slug", "is_active", "created_at"]


class MoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodEntry  # tells DRF which model to serialize
        fields = ['id', 'mood', 'intensity', 'description', 'institution', 'created_at']
        read_only_fields = ['id', 'institution', 'created_at']  # can’t be edited by user

class JournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry  # tells DRF which model to serialize
        fields = ['id', 'title', 'content', 'institution', 'created_at', 'updated_at']
        read_only_fields = ['id', 'institution', 'created_at', 'updated_at']  # can’t be edited by user


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "sender", "message", "institution", "metadata", "created_at"]
        read_only_fields = ["id", "institution", "created_at"]


class CrisisAlertSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)
    counsellor = UserSummarySerializer(read_only=True)

    class Meta:
        model = CrisisAlert
        fields = ["id", "user", "counsellor", "institution", "trigger", "source", "status", "notes", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "counsellor", "institution", "trigger", "source", "created_at", "updated_at"]


class AppointmentSerializer(serializers.ModelSerializer):
    student = UserSummarySerializer(read_only=True)
    counsellor = UserSummarySerializer(read_only=True)
    counsellor_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "student",
            "counsellor",
            "institution",
            "counsellor_id",
            "requested_for",
            "status",
            "reason",
            "counsellor_note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "student", "counsellor", "institution", "created_at", "updated_at"]


class DirectMessageSerializer(serializers.ModelSerializer):
    sender = UserSummarySerializer(read_only=True)
    recipient = UserSummarySerializer(read_only=True)
    recipient_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = DirectMessage
        fields = ["id", "sender", "recipient", "institution", "recipient_id", "body", "read_at", "created_at"]
        read_only_fields = ["id", "sender", "recipient", "institution", "read_at", "created_at"]


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ["id", "title", "category", "content", "institution", "created_at"]
        read_only_fields = ["id", "institution", "created_at"]
