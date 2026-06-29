from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from auth_app.models import User, Institution


class AuthAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.institution = Institution.objects.create(name="Test University", slug="test-uni")

    def test_signup_requires_pau_email(self):
        response = self.client.post(
            "/api/auth/signup/",
            {
                "email": "student@other.com",
                "password": "testpass123",
                "role": "student",
                "institution_id": self.institution.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("pau.edu.ng", response.data["message"])

    def test_signup_success(self):
        response = self.client.post(
            "/api/auth/signup/",
            {
                "email": "student@pau.edu.ng",
                "password": "testpass123",
                "role": "student",
                "institution_id": self.institution.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(email="student@pau.edu.ng").exists())

    def test_login_invalid_password(self):
        User.objects.create_user(email="test@pau.edu.ng", password="correctpass", institution=self.institution)
        response = self.client.post(
            "/api/auth/login/",
            {"email": "test@pau.edu.ng", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_login_success(self):
        User.objects.create_user(email="test@pau.edu.ng", password="testpass123", institution=self.institution)
        response = self.client.post(
            "/api/auth/login/",
            {"email": "test@pau.edu.ng", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)