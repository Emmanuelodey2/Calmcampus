from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Institution(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)  # hashes password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        user = self.create_user(email, password, **extra_fields)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):  # 👈 add PermissionsMixin here
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        COUNSELLOR = "counsellor", "Counsellor"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    assigned_counsellor = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_students",
        limit_choices_to={"role": Role.COUNSELLOR},
    )
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    # Counsellor Intake & Student Wellness Fields
    mental_health_issues = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)
    current_medication = models.TextField(blank=True, null=True)
    has_previous_therapy = models.BooleanField(default=False)
    reason_for_seeking_help = models.TextField(blank=True, null=True)
    anonymous_to_counsellor = models.BooleanField(default=False)
    
    # New physical and AI summary fields
    age = models.IntegerField(blank=True, null=True)
    weight = models.FloatField(blank=True, null=True)  # in kg
    height = models.FloatField(blank=True, null=True)  # in cm
    ai_comments = models.TextField(blank=True, null=True)  # AI-generated analysis based on chats, journals, and moods

    email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    objects = UserManager()


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_verification_tokens")
    token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Email verification token for {self.user.email}"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Password reset token for {self.user.email}"
