from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .ai import CRISIS_RESPONSE, build_system_prompt, call_gemini, detect_crisis, fallback_response
from .models import Appointment, ChatMessage, CrisisAlert, DirectMessage, Institution, JournalEntry, MoodEntry, Notification, Resource, StudentResource, Feedback, CounsellorNote
from .serializers import (
    AppointmentSerializer,
    ChatMessageSerializer,
    CrisisAlertSerializer,
    DirectMessageSerializer,
    InstitutionSerializer,
    JournalSerializer,
    MoodSerializer,
    NotificationSerializer,
    ResourceSerializer,
    UserSummarySerializer,
    StudentResourceSerializer,
    FeedbackSerializer,
    CounsellorNoteSerializer,
)
from auth_app.models import Institution

User = get_user_model()


def is_system_admin(user):
    return bool(user and (user.is_superuser or user.is_staff or user.role == User.Role.ADMIN))


def is_counsellor(user):
    return user.role in {User.Role.COUNSELLOR, User.Role.ADMIN} or user.is_staff


def get_request_institution(request):
    if not request.user.is_authenticated:
        return None

    if is_system_admin(request.user):
        # Admins can scope to a specific institution via header or query param
        institution_id = request.headers.get("X-Institution-ID") or request.query_params.get("institution_id")
        if institution_id:
            institution = Institution.objects.filter(id=institution_id, is_active=True).first()
            if institution:
                return institution
        # Admin with no scope: fall back to first active institution
        return Institution.objects.filter(is_active=True).order_by("name").first()

    # Regular users always get their own institution from the DB
    return request.user.institution


def require_institution(request):
    institution = get_request_institution(request)
    if not institution:
        return None, Response({"message": "Institution is required"}, status=status.HTTP_400_BAD_REQUEST)
    return institution, None


def scope_queryset(queryset, institution):
    return queryset.filter(institution=institution) if institution else queryset.none()


def get_default_counsellor(student, institution=None):
    institution = institution or student.institution
    if student.assigned_counsellor and student.assigned_counsellor.institution_id == getattr(institution, "id", None):
        return student.assigned_counsellor
    return User.objects.filter(role=User.Role.COUNSELLOR, institution=institution).first()


@api_view(["GET", "POST"])
def institutions_view(request):
    if not is_system_admin(request.user):
        return Response({"message": "Admin role required"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        return Response(InstitutionSerializer(Institution.objects.all().order_by("name"), many=True).data)

    institution_id = request.data.get("id")
    name = (request.data.get("name") or "").strip()
    slug = (request.data.get("slug") or "").strip()
    is_active = request.data.get("is_active")

    if institution_id:
        institution = Institution.objects.filter(id=institution_id).first()
        if not institution:
            return Response({"message": "Institution not found"}, status=status.HTTP_404_NOT_FOUND)
        if name:
            institution.name = name
        if slug:
            institution.slug = slugify(slug)
        elif name:
            institution.slug = slugify(name)
        if is_active is not None:
            institution.is_active = bool(is_active)
        institution.save()
        return Response(InstitutionSerializer(institution).data)

    if not name:
        return Response({"message": "Name is required"}, status=status.HTTP_400_BAD_REQUEST)

    institution = Institution.objects.create(
        name=name,
        slug=slugify(slug or name),
        is_active=bool(is_active) if is_active is not None else True,
    )
    return Response(InstitutionSerializer(institution).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST", "PATCH"])
def admin_users_view(request):
    if not is_system_admin(request.user):
        return Response({"message": "Admin role required"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        institution = get_request_institution(request)
        users = User.objects.all().order_by("email")
        if institution:
            users = users.filter(institution=institution)
        return Response(UserSummarySerializer(users, many=True, context={"request": request}).data)

    if request.method == "POST":
        institution_id = request.data.get("institution") or request.data.get("institution_id")
        institution = Institution.objects.filter(id=institution_id, is_active=True).first() if institution_id else get_request_institution(request)
        role = request.data.get("role", User.Role.STUDENT)
        if role not in {User.Role.STUDENT, User.Role.COUNSELLOR, User.Role.ADMIN}:
            return Response({"message": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
        if role != User.Role.ADMIN and not institution:
            return Response({"message": "Institution is required"}, status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"message": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"message": "User already exists"}, status=status.HTTP_409_CONFLICT)

        user = User.objects.create_user(email=email, password=password, role=role, institution=institution)
        assigned_counsellor_id = request.data.get("assigned_counsellor_id")
        if assigned_counsellor_id:
            assigned = User.objects.filter(id=assigned_counsellor_id, institution=institution, role=User.Role.COUNSELLOR).first()
            if assigned:
                user.assigned_counsellor = assigned
                user.save(update_fields=["assigned_counsellor"])
        return Response(UserSummarySerializer(user, context={"request": request}).data, status=status.HTTP_201_CREATED)

    user_id = request.data.get("id")
    user = User.objects.filter(id=user_id).first()
    if not user:
        return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    institution_id = request.data.get("institution")
    if institution_id:
        institution = Institution.objects.filter(id=institution_id, is_active=True).first()
        if not institution:
            return Response({"message": "Institution not found"}, status=status.HTTP_404_NOT_FOUND)
        user.institution = institution

    if "institution_id" in request.data and not institution_id:
        user.institution = None

    if "role" in request.data and request.data["role"] in {User.Role.STUDENT, User.Role.COUNSELLOR, User.Role.ADMIN}:
        user.role = request.data["role"]

    if "email" in request.data and request.data["email"]:
        user.email = request.data["email"]

    if "is_active" in request.data:
        user.is_active = bool(request.data["is_active"])

    if "assigned_counsellor_id" in request.data:
        assigned = User.objects.filter(
            id=request.data["assigned_counsellor_id"],
            institution=user.institution,
            role=User.Role.COUNSELLOR,
        ).first()
        user.assigned_counsellor = assigned

    user.save()
    return Response(UserSummarySerializer(user, context={"request": request}).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_overview_view(request):
    if not is_system_admin(request.user):
        return Response({"message": "Admin role required"}, status=status.HTTP_403_FORBIDDEN)

    institution = get_request_institution(request)
    institutions = Institution.objects.all().order_by("name")
    users = User.objects.all().order_by("email")
    moods = MoodEntry.objects.all()
    journals = JournalEntry.objects.all()
    alerts = CrisisAlert.objects.all()
    appointments = Appointment.objects.all()
    messages = DirectMessage.objects.all()
    feedbacks = Feedback.objects.all()

    if institution:
        users = users.filter(institution=institution)
        moods = moods.filter(institution=institution)
        journals = journals.filter(institution=institution)
        alerts = alerts.filter(institution=institution)
        appointments = appointments.filter(institution=institution)
        messages = messages.filter(institution=institution)
        feedbacks = feedbacks.filter(institution=institution)

    payload = {
        "selected_institution": InstitutionSerializer(institution).data if institution else None,
        "institutions": InstitutionSerializer(institutions, many=True).data,
        "user_count": users.count(),
        "student_count": users.filter(role=User.Role.STUDENT).count(),
        "counsellor_count": users.filter(role=User.Role.COUNSELLOR).count(),
        "mood_count": moods.count(),
        "journal_count": journals.count(),
        "alert_count": alerts.count(),
        "appointment_count": appointments.count(),
        "message_count": messages.count(),
        "feedback_count": feedbacks.count(),
        "users": UserSummarySerializer(users[:50], many=True, context={"request": request}).data,
    }
    return Response(payload)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    recent_moods = scope_queryset(MoodEntry.objects.filter(user=request.user), institution).order_by("-created_at")[:7]
    recent_journals = scope_queryset(JournalEntry.objects.filter(user=request.user), institution).order_by("-created_at")[:5]
    return Response(
        {
            "user": UserSummarySerializer(request.user, context={"request": request}).data,
            "moods": MoodSerializer(recent_moods, many=True).data,
            "journals": JournalSerializer(recent_journals, many=True).data,
            "open_alerts": scope_queryset(CrisisAlert.objects.filter(user=request.user, status="open"), institution).count(),
        }
    )


NEGATIVE_MOODS = {"sad", "anxious", "angry", "stressed"}
POSITIVE_MOODS = {"happy", "neutral"}


def check_mood_pattern_alert(user, institution):
    """Analyse last 7 moods. Alert counsellor if:
    - Average positive intensity < 3, AND
    - Average negative intensity > average positive intensity.
    """
    recent = list(
        scope_queryset(MoodEntry.objects.filter(user=user), institution)
        .order_by("-created_at")[:7]
    )
    if len(recent) < 3:
        return  # not enough data

    negatives = [m.intensity for m in recent if m.mood in NEGATIVE_MOODS]
    positives = [m.intensity for m in recent if m.mood in POSITIVE_MOODS]

    if not negatives:
        return

    neg_avg = sum(negatives) / len(negatives)
    pos_avg = sum(positives) / len(positives) if positives else 0

    already_alerted = CrisisAlert.objects.filter(
        user=user, institution=institution, source="mood_pattern", status="open"
    ).exists()

    if pos_avg < 3 and neg_avg > pos_avg and not already_alerted:
        CrisisAlert.objects.create(
            user=user,
            counsellor=get_default_counsellor(user, institution),
            institution=institution,
            trigger=f"Sustained negative mood pattern: neg avg {neg_avg:.1f}/10, pos avg {pos_avg:.1f}/10",
            source="mood_pattern",
        )


@api_view(["GET", "POST", "PATCH"])
def moods_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        moods = scope_queryset(MoodEntry.objects.filter(user=request.user), institution).order_by("-created_at")
        return Response(MoodSerializer(moods, many=True).data)

    if request.method == "PATCH":
        mood_id = request.data.get("id")
        mood = scope_queryset(MoodEntry.objects.filter(user=request.user), institution).filter(id=mood_id).first()
        if not mood:
            return Response({"message": "Mood entry not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = MoodSerializer(mood, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # POST — create new mood
    serializer = MoodSerializer(data=request.data)
    if serializer.is_valid():
        mood = serializer.save(user=request.user, institution=institution)
        # Immediate alert: very low intensity
        if mood.intensity <= 2:
            CrisisAlert.objects.create(
                user=request.user,
                counsellor=get_default_counsellor(request.user, institution),
                institution=institution,
                trigger=f"Very low mood score: {mood.intensity}/10 ({mood.mood})",
                source="mood",
            )
        # Pattern-based alert
        check_mood_pattern_alert(request.user, institution)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST", "PATCH"])
def journal_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        journals = scope_queryset(JournalEntry.objects.filter(user=request.user), institution).order_by("-created_at")
        return Response(JournalSerializer(journals, many=True).data)

    if request.method == "PATCH":
        journal_id = request.data.get("id")
        journal = scope_queryset(JournalEntry.objects.filter(user=request.user), institution).filter(id=journal_id).first()
        if not journal:
            return Response({"message": "Journal entry not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = JournalSerializer(journal, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # POST — create new journal
    data = request.data.get("entryToSave", request.data)
    serializer = JournalSerializer(data=data)
    if serializer.is_valid():
        journal = serializer.save(user=request.user, institution=institution)
        trigger = detect_crisis(f"{journal.title or ''} {journal.content}")
        if trigger:
            CrisisAlert.objects.create(
                user=request.user,
                counsellor=get_default_counsellor(request.user, institution),
                institution=institution,
                trigger=trigger,
                source="journal",
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def chat_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        messages = scope_queryset(ChatMessage.objects.filter(user=request.user), institution).order_by("-created_at")[:30]
        return Response(ChatMessageSerializer(reversed(messages), many=True).data)

    # Handle clear_context — reset the AI session for this user
    if request.data.get("clear_context"):
        from .models import AIContext
        AIContext.objects.filter(user=request.user, institution=institution).delete()
        # Also clear recent chat messages so the AI has a fresh context
        return Response({"cleared": True}, status=status.HTTP_200_OK)

    message = request.data.get("message", "").strip()
    if not message:
        return Response({"message": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

    ChatMessage.objects.create(user=request.user, institution=institution, sender="user", message=message)
    trigger = detect_crisis(message)
    is_crisis = bool(trigger)

    if is_crisis:
        ai_message = CRISIS_RESPONSE
        CrisisAlert.objects.create(
            user=request.user,
            counsellor=get_default_counsellor(request.user, institution),
            institution=institution,
            trigger=trigger,
            source="chat",
        )
    else:
        moods = scope_queryset(MoodEntry.objects.filter(user=request.user), institution).order_by("-created_at")[:14]
        journals = scope_queryset(JournalEntry.objects.filter(user=request.user), institution).order_by("-created_at")[:5]
        from .models import CounsellorNote
        counsellor_notes = CounsellorNote.objects.filter(student=request.user).order_by("-created_at")[:5]
        system_prompt = build_system_prompt(request.user, moods, journals, counsellor_notes)
        ai_message = call_gemini(system_prompt, message) or fallback_response(message, list(moods))
        response_trigger = detect_crisis(ai_message)
        if response_trigger:
            is_crisis = True
            trigger = response_trigger
            ai_message = CRISIS_RESPONSE
            CrisisAlert.objects.create(
                user=request.user,
                counsellor=get_default_counsellor(request.user, institution),
                institution=institution,
                trigger=response_trigger,
                source="ai_response",
            )

    assistant = ChatMessage.objects.create(
        user=request.user,
        institution=institution,
        sender="ai",
        message=ai_message,
        metadata={"crisis": is_crisis, "trigger": trigger},
    )
    return Response(
        {
            "reply": ChatMessageSerializer(assistant).data,
            "crisis": is_crisis,
            "trigger": trigger,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def counsellors_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    counsellors = User.objects.filter(role=User.Role.COUNSELLOR, institution=institution).order_by("email")
    return Response(UserSummarySerializer(counsellors, many=True).data)


@api_view(["GET", "PATCH"])
def crisis_alerts_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        alerts = CrisisAlert.objects.filter(institution=institution)
        if not is_counsellor(request.user):
            alerts = alerts.filter(user=request.user)
        return Response(CrisisAlertSerializer(alerts, many=True).data)

    if not is_counsellor(request.user):
        return Response({"message": "Counsellor role required"}, status=status.HTTP_403_FORBIDDEN)

    alert_id = request.data.get("id")
    try:
        alert = CrisisAlert.objects.get(id=alert_id)
    except CrisisAlert.DoesNotExist:
        return Response({"message": "Alert not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = CrisisAlertSerializer(alert, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save(counsellor=alert.counsellor or request.user, institution=institution)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST", "PATCH"])
def appointments_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        appointments = (
            Appointment.objects.filter(counsellor=request.user, institution=institution)
            if is_counsellor(request.user)
            else Appointment.objects.filter(student=request.user, institution=institution)
        )
        return Response(AppointmentSerializer(appointments, many=True).data)

    if request.method == "POST":
        serializer = AppointmentSerializer(data=request.data)
        if serializer.is_valid():
            if is_counsellor(request.user):
                student_id = serializer.validated_data.pop("student_id", None)
                student = User.objects.filter(id=student_id, role=User.Role.STUDENT, institution=institution).first()
                if not student:
                    return Response({"message": "Student is required"}, status=status.HTTP_400_BAD_REQUEST)
                appointment = serializer.save(student=student, counsellor=request.user, requested_by=request.user, institution=institution)
                Notification.objects.create(recipient=student, actor=request.user, verb="appointment_requested", description=f"{request.user.email} requested an appointment with you for {appointment.requested_for}.")
                Notification.objects.create(recipient=request.user, actor=request.user, verb="appointment_requested", description=f"Your appointment with {student.email} has been requested for {appointment.requested_for}.")
            else:
                counsellor_id = serializer.validated_data.pop("counsellor_id", None)
                counsellor = User.objects.filter(id=counsellor_id, role=User.Role.COUNSELLOR, institution=institution).first()
                counsellor = counsellor or get_default_counsellor(request.user, institution)
                if not counsellor:
                    return Response({"message": "No counsellor is available"}, status=status.HTTP_400_BAD_REQUEST)
                appointment = serializer.save(student=request.user, counsellor=counsellor, requested_by=request.user, institution=institution)
                Notification.objects.create(recipient=counsellor, actor=request.user, verb="appointment_requested", description=f"{request.user.email} requested an appointment with you for {appointment.requested_for}.")
                Notification.objects.create(recipient=request.user, actor=request.user, verb="appointment_requested", description=f"Your appointment with {counsellor.email} has been requested for {appointment.requested_for}.")
            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        appointment = Appointment.objects.get(id=request.data.get("id"), institution=institution)
    except Appointment.DoesNotExist:
        return Response({"message": "Appointment not found"}, status=status.HTTP_404_NOT_FOUND)

    is_participant = appointment.student == request.user or appointment.counsellor == request.user
    if not is_participant:
        return Response({"message": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

    if request.data.get("status") == "approved" and appointment.requested_by == request.user:
        return Response({"message": "Cannot approve your own request"}, status=status.HTTP_403_FORBIDDEN)

    serializer = AppointmentSerializer(appointment, data=request.data, partial=True)
    if serializer.is_valid():
        updated_appointment = serializer.save()
        if request.data.get("status") == "approved":
            other_party = updated_appointment.student if request.user == updated_appointment.counsellor else updated_appointment.counsellor
            Notification.objects.create(recipient=request.user, actor=request.user, verb="appointment_approved", description=f"Your appointment with {other_party.email} has been approved.")
            Notification.objects.create(recipient=other_party, actor=request.user, verb="appointment_approved", description=f"Your appointment with {request.user.email} has been approved.")
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def notifications_count_view(request):
    try:
        institution, error = require_institution(request)
        if error:
            return error

        unread_count = Notification.objects.filter(
            recipient=request.user,
            read=False,
        ).count()
        return Response({"unread_count": unread_count})
    except Exception as exc:
        return Response({"message": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def notifications_mark_read_view(request):
    try:
        institution, error = require_institution(request)
        if error:
            return error

        Notification.objects.filter(
            recipient=request.user,
            read=False,
        ).update(read=True)
        return Response({"marked_read": True})
    except Exception as exc:
        return Response({"message": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def notifications_view(request):
    try:
        institution, error = require_institution(request)
        if error:
            return error

        notifications = Notification.objects.filter(recipient=request.user).order_by("-created_at")[:50]
        return Response(NotificationSerializer(notifications, many=True).data)
    except Exception as exc:
        return Response({"message": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET", "POST"])
def direct_messages_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        messages = DirectMessage.objects.filter(institution=institution).filter(
            Q(sender=request.user) | Q(recipient=request.user)
        )

        # ?with=<user_id> — filter to a single conversation thread
        with_user_id = request.query_params.get("with")
        if with_user_id:
            messages = messages.filter(
                Q(sender_id=with_user_id) | Q(recipient_id=with_user_id)
            )
            # Mark incoming messages in this thread as read
            from django.utils import timezone
            messages.filter(recipient=request.user, read_at__isnull=True).update(read_at=timezone.now())

        messages = messages.order_by("created_at")
        return Response(DirectMessageSerializer(messages, many=True).data)

    serializer = DirectMessageSerializer(data=request.data)
    if serializer.is_valid():
        try:
            recipient = User.objects.get(id=serializer.validated_data.pop("recipient_id"))
        except User.DoesNotExist:
            return Response({"message": "Recipient not found"}, status=status.HTTP_404_NOT_FOUND)
        if recipient.institution_id != institution.id and not is_system_admin(request.user):
            return Response({"message": "Recipient must belong to the same institution"}, status=status.HTTP_400_BAD_REQUEST)
        message = serializer.save(sender=request.user, recipient=recipient, institution=institution)
        return Response(DirectMessageSerializer(message).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(["GET", "POST", "DELETE"])
def resources_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        resources = scope_queryset(Resource.objects.all(), institution).order_by("category", "title")
        return Response(ResourceSerializer(resources, many=True).data)

    # Only counsellors and admins can create or delete resources
    if not is_counsellor(request.user):
        return Response({"message": "Counsellor role required"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        serializer = ResourceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(institution=institution)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        resource_id = request.data.get("id")
        resource = scope_queryset(Resource.objects.all(), institution).filter(id=resource_id).first()
        if not resource:
            return Response({"message": "Resource not found"}, status=status.HTTP_404_NOT_FOUND)
        resource.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def counsellor_dashboard_view(request):
    """Rich dashboard for counsellors: students + their moods, appointments, open alerts."""
    if not is_counsellor(request.user):
        return Response({"message": "Counsellor role required"}, status=status.HTTP_403_FORBIDDEN)

    institution, error = require_institution(request)
    if error:
        return error

    students = User.objects.filter(role=User.Role.STUDENT, institution=institution).order_by("email")

    student_data = []
    for student in students:
        last_mood = MoodEntry.objects.filter(user=student, institution=institution).order_by("-created_at").first()
        mood_count = MoodEntry.objects.filter(user=student, institution=institution).count()
        open_alerts = CrisisAlert.objects.filter(user=student, institution=institution, status="open").count()
        appt_count = Appointment.objects.filter(student=student, institution=institution).count()
        
        student_serialized = UserSummarySerializer(student, context={"request": request}).data
        student_serialized.update({
            "last_mood": MoodSerializer(last_mood).data if last_mood else None,
            "mood_count": mood_count,
            "open_alerts": open_alerts,
            "appointment_count": appt_count,
        })
        student_data.append(student_serialized)

    open_alerts_qs = CrisisAlert.objects.filter(institution=institution, status="open").order_by("-created_at")
    appointments_qs = Appointment.objects.filter(counsellor=request.user, institution=institution).order_by("requested_for")
    resources_qs = scope_queryset(Resource.objects.all(), institution).order_by("category", "title")

    unread_messages_count = DirectMessage.objects.filter(
        institution=institution,
        recipient=request.user,
        read_at__isnull=True,
    ).count()

    notifications_count = Notification.objects.filter(
        recipient=request.user,
        read=False,
    ).count()

    pending_appointments_count = Appointment.objects.filter(
        counsellor=request.user,
        institution=institution,
        status="requested",
    ).count()

    return Response({
        "students": student_data,
        "open_alerts": CrisisAlertSerializer(open_alerts_qs, many=True).data,
        "appointments": AppointmentSerializer(appointments_qs, many=True).data,
        "resources": ResourceSerializer(resources_qs, many=True).data,
        "stats": {
            "unread_messages": unread_messages_count,
            "notifications": notifications_count,
            "open_alerts": open_alerts_qs.count(),
            "pending_appointments": pending_appointments_count,
            "total_students": students.count(),
        },
    })


@api_view(["GET", "POST"])
def student_resources_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        saved = StudentResource.objects.filter(student=request.user, resource__institution=institution)
        return Response(StudentResourceSerializer(saved, many=True).data)

    resource_id = request.data.get("id")
    if not resource_id:
        return Response({"message": "Resource ID required"}, status=status.HTTP_400_BAD_REQUEST)

    resource = scope_queryset(Resource.objects.all(), institution).filter(id=resource_id).first()
    if not resource:
        return Response({"message": "Resource not found"}, status=status.HTTP_404_NOT_FOUND)

    saved_resource, created = StudentResource.objects.get_or_create(
        student=request.user,
        resource=resource,
    )
    if created:
        return Response(StudentResourceSerializer(saved_resource).data, status=status.HTTP_201_CREATED)
    return Response({"message": "Resource already saved"}, status=status.HTTP_200_OK)


@api_view(["GET"])
def counsellor_students_view(request):
    """Get students that a counsellor can message."""
    if not is_counsellor(request.user):
        return Response({"message": "Counsellor role required"}, status=status.HTTP_403_FORBIDDEN)

    institution, error = require_institution(request)
    if error:
        return error

    students = User.objects.filter(role=User.Role.STUDENT, institution=institution).order_by("email")
    return Response(UserSummarySerializer(students, many=True, context={"request": request}).data)


@api_view(["GET", "POST"])
def feedback_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        if is_counsellor(request.user):
            feedbacks = scope_queryset(Feedback.objects.all(), institution).order_by("-created_at")
        else:
            feedbacks = scope_queryset(Feedback.objects.filter(user=request.user), institution).order_by("-created_at")
        serializer = FeedbackSerializer(feedbacks, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, institution=institution)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    if request.method == "GET":
        serializer = UserSummarySerializer(user, context={"request": request})
        return Response(serializer.data)

    if request.method == "PATCH":
        allowed_fields = [
            "phone", "address", "city",
            "mental_health_issues", "emergency_contact_name", "emergency_contact_phone",
            "medical_history", "current_medication", "has_previous_therapy",
            "reason_for_seeking_help", "anonymous_to_counsellor",
            "age", "weight", "height"
        ]
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        serializer = UserSummarySerializer(user, context={"request": request})
        return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def counsellor_student_detail_view(request, student_id):
    if not is_counsellor(request.user):
        return Response({"message": "Counsellor role required"}, status=status.HTTP_403_FORBIDDEN)
    
    institution, error = require_institution(request)
    if error:
        return error

    student = User.objects.filter(id=student_id, role=User.Role.STUDENT, institution=institution).first()
    if not student:
        return Response({"message": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

    # Check if the counselor wants to regenerate AI comments/analysis
    if request.method == "POST" and request.data.get("generate_ai_analysis"):
        from .ai import generate_student_ai_comments
        moods = MoodEntry.objects.filter(user=student, institution=institution).order_by("-created_at")[:14]
        journals = JournalEntry.objects.filter(user=student, institution=institution).order_by("-created_at")[:5]
        chats = ChatMessage.objects.filter(user=student, institution=institution).order_by("created_at")[:30]
        
        ai_analysis = generate_student_ai_comments(student, moods, journals, chats)
        student.ai_comments = ai_analysis
        student.save(update_fields=["ai_comments"])

    # Fetch student details
    student_serializer = UserSummarySerializer(student, context={"request": request})
    
    # Fetch moods
    moods = MoodEntry.objects.filter(user=student, institution=institution).order_by("-created_at")
    mood_serializer = MoodSerializer(moods, many=True)

    # Fetch journals
    journals = JournalEntry.objects.filter(user=student, institution=institution).order_by("-created_at")
    journal_serializer = JournalSerializer(journals, many=True)

    # Fetch counsellor notes about this student
    notes = CounsellorNote.objects.filter(student=student).order_by("-created_at")
    note_serializer = CounsellorNoteSerializer(notes, many=True)

    return Response({
        "student": student_serializer.data,
        "moods": mood_serializer.data,
        "journals": journal_serializer.data,
        "notes": note_serializer.data,
    })


@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def counsellor_notes_view(request):
    if not is_counsellor(request.user):
        return Response({"message": "Counsellor role required"}, status=status.HTTP_403_FORBIDDEN)
    
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        student_id = request.query_params.get("student_id")
        if not student_id:
            notes = CounsellorNote.objects.filter(counsellor=request.user).order_by("-created_at")
        else:
            notes = CounsellorNote.objects.filter(student_id=student_id).order_by("-created_at")
        return Response(CounsellorNoteSerializer(notes, many=True).data)

    if request.method == "POST":
        serializer = CounsellorNoteSerializer(data=request.data)
        if serializer.is_valid():
            student_id = serializer.validated_data["student_id"]
            student = User.objects.filter(id=student_id, role=User.Role.STUDENT, institution=institution).first()
            if not student:
                return Response({"message": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
            note = serializer.save(counsellor=request.user, student=student)
            return Response(CounsellorNoteSerializer(note).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == "DELETE":
        note_id = request.data.get("id")
        if not note_id:
            return Response({"message": "Note ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        note = CounsellorNote.objects.filter(id=note_id, counsellor=request.user).first()
        if not note:
            return Response({"message": "Note not found or unauthorized"}, status=status.HTTP_404_NOT_FOUND)
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


