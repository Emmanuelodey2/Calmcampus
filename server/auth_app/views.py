import logging
import secrets
import urllib.parse

from django.utils import timezone
from django.core.mail import send_mail
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework.decorators import api_view
from rest_framework.decorators import permission_classes
from auth_app.models import User, EmailVerificationToken, PasswordResetToken
from auth_app.models import Institution
from rest_framework.response import Response 
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from django.conf import settings
from dashboard.serializers import InstitutionSerializer\
import resend


logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY


def send_email(*, to: str, subject: str, html: str):
    return resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        }
    )

def resolve_institution(payload):
    institution_id = payload.get("institution_id") or payload.get("institution")
    institution_slug = payload.get("institution_slug")

    if institution_id:
        return Institution.objects.filter(id=institution_id, is_active=True).first()
    if institution_slug:
        return Institution.objects.filter(slug=institution_slug, is_active=True).first()

    active_institutions = Institution.objects.filter(is_active=True).order_by("name")
    if active_institutions.count() == 1:
        return active_institutions.first()
    return None


def create_token(model, user, lifetime):
    now = timezone.now()
    expires_at = now + lifetime

    while True:
        token = secrets.token_urlsafe(32)
        if not model.objects.filter(token=token).exists():
            break

    return model.objects.create(user=user, token=token, expires_at=expires_at)


def send_verification_email(user):
    token_record = create_token(
        EmailVerificationToken,
        user,
        settings.EMAIL_VERIFICATION_TOKEN_LIFETIME,
    )
    verification_url = (
        f"{settings.FRONTEND_BASE_URL.rstrip('/')}/verify-email?token={urllib.parse.quote(token_record.token)}"
    )
    message = (
        f"Welcome to CalmCampus.\n\n"
        f"Please verify your email by opening this link:\n{verification_url}\n\n"
        "If you did not create this account, you can ignore this email."
    )
    try:
        send_mail(
            "Verify your CalmCampus email",
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Error sending verification email to %s", user.email)
        if settings.DEBUG:
            logger.debug("Verification link for %s: %s", user.email, verification_url)
    return token_record

# def send_verification_email(user):
#     token_record = create_token(
#         EmailVerificationToken,
#         user,
#         settings.EMAIL_VERIFICATION_TOKEN_LIFETIME,
#     )

#     verification_url = (
#         f"{settings.FRONTEND_BASE_URL.rstrip('/')}/verify-email?token={urllib.parse.quote(token_record.token)}"
#     )

#     html = f""""
#     <h2>Welcome to CalmCampus 👋</h2>

#     <p>Thank you for creating an account.</p>

#     <p>Please verify your email by clicking the button below.</p>

#     <p>
#         <a href="{verification_url}"
#            style="
#                background:#2563eb;
#                color:white;
#                padding:12px 20px;
#                text-decoration:none;
#                border-radius:8px;
#                display:inline-block;
#            ">
#             Verify Email
#         </a>
#     </p>

#     <p>
#         Or copy this link into your browser:
#     </p>

#     <p>{verification_url}</p>

#     <p>If you did not create this account, you can safely ignore this email.</p>
#     ""

#     try:
#         send_email(
#             to=user.email,
#             subject="Verify your CalmCampus email",
#             html=html,
#         )
#     except Exception:
#         logger.exception("Error sending verification email to %s", user.email)
#         if settings.DEBUG:
#             logger.debug("Verification link: %s", verification_url)

#     return token_record
def send_password_reset_email(user):
    token_record = create_token(
        PasswordResetToken,
        user,
        settings.PASSWORD_RESET_TOKEN_LIFETIME,
    )

    reset_url = (
        f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={urllib.parse.quote(token_record.token)}"
    )

    html = f"""
    <h2>Reset your CalmCampus password</h2>

    <p>A password reset was requested for your account.</p>

    <p>
        <a href="{reset_url}"
           style="
               background:#2563eb;
               color:white;
               padding:12px 20px;
               text-decoration:none;
               border-radius:8px;
               display:inline-block;
           ">
            Reset Password
        </a>
    </p>

    <p>
        Or copy this link into your browser:
    </p>

    <p>{reset_url}</p>

    <p>If you did not request this, you can safely ignore this email.</p>
    """

    try:
        send_email(
            to=user.email,
            subject="Reset your CalmCampus password",
            html=html,
        )
    except Exception:
        logger.exception("Error sending password reset email to %s", user.email)
        if settings.DEBUG:
            logger.debug("Reset link: %s", reset_url)

    return token_record

# def send_password_reset_email(user):
#     token_record = create_token(
#         PasswordResetToken,
#         user,
#         settings.PASSWORD_RESET_TOKEN_LIFETIME,
#     )
#     reset_url = (
#         f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset-password?token={urllib.parse.quote(token_record.token)}"
#     )
#     message = (
#         f"A password reset was requested for your CalmCampus account.\n\n"
#         f"Please open this link to choose a new password:\n{reset_url}\n\n"
#         "If you did not request this, you can ignore this email."
#     )
#     print(settings.EMAIL_HOST)
#     print(settings.EMAIL_PORT)
#     print(settings.EMAIL_USE_TLS)
#     print(settings.EMAIL_USE_SSL)
#     print(bool(settings.EMAIL_HOST_PASSWORD))
#     try:
#         send_mail(
#             "Reset your CalmCampus password",
#             message,
#             settings.DEFAULT_FROM_EMAIL,
#             [user.email],
#             fail_silently=False,
#         )
#     except Exception:
#         logger.exception("Error sending password reset email to %s", user.email)
#         if settings.DEBUG:
#             logger.debug("Reset link for %s: %s", user.email, reset_url)
#     return token_record

def send_verification_email(user):
    token_record = create_token(
        EmailVerificationToken,
        user,
        settings.EMAIL_VERIFICATION_TOKEN_LIFETIME,
    )

    verification_url = (
        f"{settings.FRONTEND_BASE_URL.rstrip('/')}/verify-email?token={urllib.parse.quote(token_record.token)}"
    )

    html = f"""
    <h2>Welcome to CalmCampus 👋</h2>

    <p>Thank you for creating an account.</p>

    <p>Please verify your email by clicking the button below.</p>

    <p>
        <a href="{verification_url}"
           style="
               background:#2563eb;
               color:white;
               padding:12px 20px;
               text-decoration:none;
               border-radius:8px;
               display:inline-block;
           ">
            Verify Email
        </a>
    </p>

    <p>
        Or copy this link into your browser:
    </p>

    <p>{verification_url}</p>

    <p>If you did not create this account, you can safely ignore this email.</p>
    """

    try:
        send_email(
            to=user.email,
            subject="Verify your CalmCampus email",
            html=html,
        )
    except Exception:
        logger.exception("Error sending verification email to %s", user.email)
        if settings.DEBUG:
            logger.debug("Verification link: %s", verification_url)

    return token_record

@api_view(["GET"])
@permission_classes([AllowAny])
def institutions_view(request):
    institutions = Institution.objects.filter(is_active=True).order_by("name")
    return Response(InstitutionSerializer(institutions, many=True).data)


# Create your views here.
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    email    = request.data.get('email')
    password = request.data.get('password')
    role     = request.data.get("role", User.Role.STUDENT)

    # 1. Basic field validation first
    if not email or not password:
        return Response({'message': 'Email and password are required'}, status=400)

    # 1b. Institution email domain check
    if not email.lower().endswith('@pau.edu.ng'):
        return Response({'message': 'Only @pau.edu.ng email addresses are allowed to register'}, status=400)

    # 2. Role check
    if role not in {User.Role.STUDENT, User.Role.COUNSELLOR}:
        return Response({'message': 'Invalid role'}, status=400)

    # 3. Duplicate check
    if User.objects.filter(email=email).exists():
        return Response({'message': 'User already exists'}, status=409)

    # 4. Institution — must exist and be active
    institution = resolve_institution(request.data)
    if institution is None:
        return Response(
            {'message': 'Select a valid institution before creating an account'},
            status=400,
        )

    user = User.objects.create_user(
        email=email, password=password, role=role, institution=institution,
        email_verified=False,
    )
    try:
        send_verification_email(user)
    except Exception:
        pass  # Don't fail if email fails in development
    return Response({
        'message': 'Account created. Please check your email to verify your account before logging in.',
        'role': role,
        'institution': InstitutionSerializer(institution).data,
        'email': user.email,
        'email_verification_required': True,
    }, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    if not email or not password:
        return Response({'message': 'Email and password are required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        if not user.check_password(password):
            return Response({'message': 'Invalid Password'}, status=400)

        if not user.email_verified:
            return Response(
                {'message': 'Please verify your email before logging in. Check your inbox for the verification link.'},
                status=403,
            )

        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        if user.institution_id:
            refresh["institution_id"] = user.institution_id

        response = Response({
            'message': 'Login Successful',
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "role": user.role,
            "email": user.email,
            "institution": InstitutionSerializer(user.institution).data if user.institution_id else None,
        }, status=200)

        response.set_cookie(
            'refreshToken',
            str(refresh),
            httponly=True,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE
        )
        response.set_cookie(
            'accessToken',
            str(refresh.access_token),
            httponly=True,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE
        )

        return response

    except User.DoesNotExist:
        return Response({'message': f'No user with {email} found'}, status=404)
    
@api_view(["POST"])
@permission_classes([AllowAny])
def logout(request):
    response = Response({'message': 'Logged out successfully'})
    response.delete_cookie('refreshToken', samesite=settings.AUTH_COOKIE_SAMESITE)
    response.delete_cookie('accessToken', samesite=settings.AUTH_COOKIE_SAMESITE)
    
    return response

@api_view(["GET"])
def auth(request):
    return Response({
        'id': request.user.id,
        'email': request.user.email,
        'role': request.user.role,
        'institution': InstitutionSerializer(request.user.institution).data if request.user.institution_id else None,
    })


# Email verification
@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.data.get("token", "").strip()
    if not token:
        return Response({"message": "Token is required"}, status=400)

    try:
        token_obj = EmailVerificationToken.objects.get(token=token, used_at__isnull=True)
    except EmailVerificationToken.DoesNotExist:
        return Response({"message": "Invalid or expired token"}, status=404)

    if token_obj.expires_at < timezone.now():
        return Response({"message": "Token has expired"}, status=400)

    token_obj.user.email_verified = True
    token_obj.user.save(update_fields=["email_verified"])
    token_obj.used_at = timezone.now()
    token_obj.save(update_fields=["used_at"])

    return Response({"message": "Email verified successfully"})


# Request password reset
@api_view(["POST"])
@permission_classes([AllowAny])
def request_password_reset(request):
    print("Content-Type:", request.content_type)
    print("Raw body:", request.body)
    print("request.data:", request.data)
    email = request.data.get("email", "").strip()
    if not email:
        return Response({"message": "Email is required"}, status=400)

    try:
        user = User.objects.get(email=email)
        send_password_reset_email(user)
    except User.DoesNotExist:
        pass  # Don't reveal if user exists

    return Response({"message": "If the email exists, a reset link has been sent"})


# Password reset
@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    token = request.data.get("token", "").strip()
    password = request.data.get("password", "").strip()
    if not token or not password:
        return Response({"message": "Token and password are required"}, status=400)

    try:
        token_obj = PasswordResetToken.objects.get(token=token, used_at__isnull=True)
    except PasswordResetToken.DoesNotExist:
        return Response({"message": "Invalid or expired token"}, status=404)

    if token_obj.expires_at < timezone.now():
        return Response({"message": "Token has expired"}, status=400)

    try:
        validate_password(password, token_obj.user)
    except ValidationError as e:
        return Response({"message": " ".join(e.messages)}, status=400)

    token_obj.user.set_password(password)
    token_obj.user.save(update_fields=["password"])
    token_obj.used_at = timezone.now()
    token_obj.save(update_fields=["used_at"])

    return Response({"message": "Password reset successfully"})
