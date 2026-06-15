from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils.text import slugify
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .ai import CRISIS_RESPONSE, build_system_prompt, call_gemini, detect_crisis, fallback_response
from .models import Appointment, ChatMessage, CrisisAlert, DirectMessage, JournalEntry, MoodEntry, Resource
from .serializers import (
    AppointmentSerializer,
    ChatMessageSerializer,
    CrisisAlertSerializer,
    DirectMessageSerializer,
    InstitutionSerializer,
    JournalSerializer,
    MoodSerializer,
    ResourceSerializer,
    UserSummarySerializer,
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
        institution_id = request.headers.get("X-Institution-ID") or request.query_params.get("institution_id")
        if institution_id:
            institution = Institution.objects.filter(id=institution_id, is_active=True).first()
            if institution:
                return institution

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
        return Response(UserSummarySerializer(users, many=True).data)

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
        return Response(UserSummarySerializer(user).data, status=status.HTTP_201_CREATED)

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
    return Response(UserSummarySerializer(user).data)


@api_view(["GET"])
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

    if institution:
        users = users.filter(institution=institution)
        moods = moods.filter(institution=institution)
        journals = journals.filter(institution=institution)
        alerts = alerts.filter(institution=institution)
        appointments = appointments.filter(institution=institution)
        messages = messages.filter(institution=institution)

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
        "users": UserSummarySerializer(users[:50], many=True).data,
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
            "user": UserSummarySerializer(request.user).data,
            "moods": MoodSerializer(recent_moods, many=True).data,
            "journals": JournalSerializer(recent_journals, many=True).data,
            "open_alerts": scope_queryset(CrisisAlert.objects.filter(user=request.user, status="open"), institution).count(),
        }
    )


@api_view(["GET", "POST"])
def moods_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        moods = scope_queryset(MoodEntry.objects.filter(user=request.user), institution).order_by("-created_at")
        return Response(MoodSerializer(moods, many=True).data)

    serializer = MoodSerializer(data=request.data)
    if serializer.is_valid():
        mood = serializer.save(user=request.user, institution=institution)
        if mood.intensity <= 2:
            CrisisAlert.objects.create(
                user=request.user,
                counsellor=get_default_counsellor(request.user, institution),
                institution=institution,
                trigger=f"Low mood score: {mood.intensity}/10",
                source="mood",
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def journal_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        journals = scope_queryset(JournalEntry.objects.filter(user=request.user), institution).order_by("-created_at")
        return Response(JournalSerializer(journals, many=True).data)

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
        system_prompt = build_system_prompt(request.user, moods, journals)
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
            counsellor_id = serializer.validated_data.pop("counsellor_id", None)
            counsellor = User.objects.filter(id=counsellor_id, role=User.Role.COUNSELLOR, institution=institution).first()
            counsellor = counsellor or get_default_counsellor(request.user, institution)
            if not counsellor:
                return Response({"message": "No counsellor is available"}, status=status.HTTP_400_BAD_REQUEST)
            appointment = serializer.save(student=request.user, counsellor=counsellor, institution=institution)
            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if not is_counsellor(request.user):
        return Response({"message": "Counsellor role required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        appointment = Appointment.objects.get(id=request.data.get("id"), counsellor=request.user, institution=institution)
    except Appointment.DoesNotExist:
        return Response({"message": "Appointment not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = AppointmentSerializer(appointment, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST"])
def direct_messages_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    if request.method == "GET":
        messages = DirectMessage.objects.filter(institution=institution).filter(Q(sender=request.user) | Q(recipient=request.user))
        return Response(DirectMessageSerializer(messages, many=True).data)

    serializer = DirectMessageSerializer(data=request.data)
    if serializer.is_valid():
        try:
            recipient = User.objects.get(id=serializer.validated_data.pop("recipient_id"))
        except User.DoesNotExist:
            return Response({"message": "Recipient not found"}, status=status.HTTP_404_NOT_FOUND)
        if recipient.institution_id != institution.id:
            return Response({"message": "Recipient must belong to the same institution"}, status=status.HTTP_400_BAD_REQUEST)
        message = serializer.save(sender=request.user, recipient=recipient, institution=institution)
        return Response(DirectMessageSerializer(message).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def resources_view(request):
    institution, error = require_institution(request)
    if error:
        return error

    resources = scope_queryset(Resource.objects.all(), institution).order_by("category", "title")
    return Response(ResourceSerializer(resources, many=True).data)
