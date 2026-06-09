# your_app/authentication.py

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        excluded_paths = [
            "/api/auth/login/",
            "/api/auth/signup/",
            "/api/logout/",
        ]
        if request.path in excluded_paths:
            return None

        print("Checking for access token in cookies")
        raw_token = request.COOKIES.get("accessToken")

        if raw_token is None:
            print("No access token in cookies, checking headers")
            header = self.get_header(request)
            if header:
                raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            print("Validating token:", raw_token)
            validated_token = self.get_validated_token(raw_token)
        except TokenError as e:
            print(f"Access token invalid: {e}")
            refresh_token = request.COOKIES.get("refreshToken")

            if not refresh_token:
                raise AuthenticationFailed("Invalid or expired token, and no refresh token available")

            try:
                print("Refreshing token with refreshToken...")
                new_access_token = str(RefreshToken(refresh_token).access_token)
            except Exception as e:
                raise AuthenticationFailed(f"Refresh token invalid or expired: {e}")

            # Attach for middleware/response to update cookies
            request._new_access_token = new_access_token
            validated_token = self.get_validated_token(new_access_token)

        return self.get_user(validated_token), validated_token
