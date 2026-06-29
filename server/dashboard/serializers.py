from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import (
    Appointment,
    ChatMessage,
    CrisisAlert,
    DirectMessage,
    JournalEntry,
    MoodEntry,
    Notification,
    Resource,
    StudentResource,
    Feedback,
    CounsellorNote,
)
from auth_app.models import Institution

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    institution_name = serializers.SerializerMethodField()
    institution_slug = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "role",
            "institution",
            "institution_name",
            "institution_slug",
            "is_active",
            "phone",
            "address",
            "city",
            "mental_health_issues",
            "emergency_contact_name",
            "emergency_contact_phone",
            "medical_history",
            "current_medication",
            "has_previous_therapy",
            "reason_for_seeking_help",
            "anonymous_to_counsellor",
            "age",
            "weight",
            "height",
            "ai_comments",
        ]

    def get_institution_name(self, obj):
        try:
            return obj.institution.name if obj.institution else None
        except Exception:
            return None

    def get_institution_slug(self, obj):
        try:
            return obj.institution.slug if obj.institution else None
        except Exception:
            return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get("request")
        
        # Mask if the student has chosen counselor anonymity
        if instance.role == User.Role.STUDENT and getattr(instance, "anonymous_to_counsellor", False):
            # Check if requester is NOT the student themselves
            is_owner = request and request.user and request.user.id == instance.id
            if not is_owner:
                # Mask identifying details for counselors
                ret["email"] = f"Anonymous Student {instance.id}"
                ret["phone"] = "Anonymous"
                ret["address"] = "Anonymous"
                ret["city"] = "Anonymous"
                ret["emergency_contact_name"] = "Anonymous"
                ret["emergency_contact_phone"] = "Anonymous"
        return ret


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ["id", "name", "slug", "is_active", "created_at"]


class MoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodEntry
        fields = ['id', 'mood', 'intensity', 'description', 'institution', 'created_at']
        read_only_fields = ['id', 'institution', 'created_at']

class JournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ['id', 'title', 'content', 'institution', 'created_at', 'updated_at']
        read_only_fields = ['id', 'institution', 'created_at', 'updated_at']


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


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSummarySerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "actor", "verb", "description", "read", "created_at"]
        read_only_fields = ["id", "actor", "verb", "description", "read", "created_at"]


class AppointmentSerializer(serializers.ModelSerializer):
    student = UserSummarySerializer(read_only=True)
    counsellor = UserSummarySerializer(read_only=True)
    requested_by = UserSummarySerializer(read_only=True)
    counsellor_id = serializers.IntegerField(write_only=True, required=False)
    student_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "student",
            "counsellor",
            "institution",
            "counsellor_id",
            "student_id",
            "requested_by",
            "requested_for",
            "status",
            "reason",
            "counsellor_note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "student", "counsellor", "institution", "requested_by", "created_at", "updated_at"]


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


class StudentResourceSerializer(serializers.ModelSerializer):
    resource = ResourceSerializer(read_only=True)
    class Meta:
        model = StudentResource
        fields = ["id", "resource", "saved_at", "notes"]
        read_only_fields = ["id", "resource", "saved_at"]


class FeedbackSerializer(serializers.ModelSerializer):
    user = UserSummarySerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = ["id", "user", "institution", "category", "rating", "comment", "created_at"]
        read_only_fields = ["id", "user", "institution", "created_at"]


class CounsellorNoteSerializer(serializers.ModelSerializer):
    counsellor = UserSummarySerializer(read_only=True)
    student = UserSummarySerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = CounsellorNote
        fields = ["id", "counsellor", "student", "student_id", "content", "created_at", "updated_at"]
        read_only_fields = ["id", "counsellor", "student", "created_at", "updated_at"]


