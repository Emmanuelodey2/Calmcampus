from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from auth_app.models import User, Institution


class DashboardAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.institution = Institution.objects.create(name="Test University", slug="test-uni")
        self.student = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            role=User.Role.STUDENT,
            institution=self.institution,
        )
        self.counsellor = User.objects.create_user(
            email="counsellor@test.com",
            password="testpass123",
            role=User.Role.COUNSELLOR,
            institution=self.institution,
        )

    def test_mood_create_requires_auth(self):
        url = reverse("moods")
        response = self.client.post("/api/moods/", {"mood": "happy", "intensity": 5}, format="json")
        self.assertEqual(response.status_code, 401)

    def test_mood_create_authenticated(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/moods/", {"mood": "happy", "intensity": 5}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["mood"], "happy")

    def test_crisis_alert_on_low_mood(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/moods/", {"mood": "sad", "intensity": 2}, format="json")
        self.assertEqual(response.status_code, 201)
        from dashboard.models import CrisisAlert
        alert = CrisisAlert.objects.filter(user=self.student).first()
        self.assertIsNotNone(alert)
        self.assertEqual(alert.trigger, "Very low mood score: 2/10 (sad)")

    def test_chat_requires_message(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/chat/", {}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_journal_create(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/journals/", {"content": "Test entry"}, format="json")
        self.assertEqual(response.status_code, 201)