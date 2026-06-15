from django.db import models
from auth_app.models import Institution, User

# -----------------------------
# Mood Tracking
# -----------------------------
class MoodEntry(models.Model):
    MOOD_CHOICES = [
        ("happy", "Happy"),
        ("sad", "Sad"),
        ("anxious", "Anxious"),
        ("angry", "Angry"),
        ("stressed", "Stressed"),
        ("neutral", "Neutral"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="moods")
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="moods", null=True, blank=True)
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    intensity = models.PositiveIntegerField(default=5)  # scale 1–10
    description = models.TextField(blank=True, null=True)
    tags = models.JSONField(null=True, blank=True)  # AI-detected keywords
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mood by {self.user.email} - {self.mood} ({self.created_at.date()})"


# -----------------------------
# Journaling (permanent, private)
# -----------------------------
class JournalEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="journals")
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="journals", null=True, blank=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField()
    ai_summary = models.TextField(blank=True, null=True)  # short AI summary
    sentiment_score = models.FloatField(null=True, blank=True)  # -1 (neg) to +1 (pos)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"Journal by {self.user.email} on {self.created_at.date()}"


# -----------------------------
# Temporary Chat (NOT permanent)
# -----------------------------
class ChatMessage(models.Model):
    """
    Stores only recent messages (for AI context).
    Can be auto-deleted after N hours or after session ends.
    """

    SENDER_CHOICES = [
        ("user", "User"),
        ("ai", "AI"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="temp_messages")
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="chat_messages", null=True, blank=True)
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    message = models.TextField()
    metadata = models.JSONField(null=True, blank=True)  # e.g. AI tokens, sentiment
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.sender} -> {self.user.email} ({self.created_at})"


# -----------------------------
# AI Context (snapshot memory)
# -----------------------------
class AIContext(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="ai_context")
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="ai_contexts", null=True, blank=True)
    last_mood = models.CharField(max_length=20, blank=True, null=True)
    last_journal_summary = models.TextField(blank=True, null=True)
    conversation_state = models.JSONField(null=True, blank=True)  # last few messages
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AI Context for {self.user.email}"


# -----------------------------
# Resources (help articles, tips)
# -----------------------------
class Resource(models.Model):
    CATEGORY_CHOICES = [
        ("stress", "Stress"),
        ("anxiety", "Anxiety"),
        ("depression", "Depression"),
        ("mindfulness", "Mindfulness"),
        ("study", "Study/Focus"),
    ]

    title = models.CharField(max_length=255)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="resources", null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    content = models.TextField()  # article or exercise
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class CrisisAlert(models.Model):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("reviewing", "Reviewing"),
        ("resolved", "Resolved"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="crisis_alerts")
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="crisis_alerts", null=True, blank=True)
    counsellor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_crisis_alerts",
    )
    trigger = models.CharField(max_length=255)
    source = models.CharField(max_length=40, default="chat")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="open")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Crisis alert for {self.user.email}: {self.trigger}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ("requested", "Requested"),
        ("approved", "Approved"),
        ("rescheduled", "Rescheduled"),
        ("cancelled", "Cancelled"),
    ]

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="appointments")
    counsellor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="counsellor_appointments")
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="appointments", null=True, blank=True)
    requested_for = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="requested")
    reason = models.TextField(blank=True)
    counsellor_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["requested_for"]

    def __str__(self):
        return f"{self.student.email} with {self.counsellor.email} on {self.requested_for}"


class DirectMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_direct_messages")
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_direct_messages")
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name="direct_messages", null=True, blank=True)
    body = models.TextField()
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.email} -> {self.recipient.email}"
