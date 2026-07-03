import logging

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Exclude auth endpoints and OPTIONS preflight from authentication
        if request.method == "OPTIONS":
            return None
        
        excluded_paths = [
            "/api/auth/login/",
            "/api/auth/signup/",
            "/api/auth/logout/",
            "/api/auth/verify-email/",
            "/api/auth/request-password-reset/",
            "/api/auth/reset-password/",
            "/api/auth/institutions/",
        ]
        if request.path in excluded_paths:
            return None

        raw_token = request.COOKIES.get("accessToken")

        if raw_token is None:
            header = self.get_header(request)
            if header:
                raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError as e:
            logger.debug("Access token invalid: %s", e)
            refresh_token = request.COOKIES.get("refreshToken")

            if not refresh_token:
                raise AuthenticationFailed("Invalid or expired token, and no refresh token available")

            try:
                new_access_token = str(RefreshToken(refresh_token).access_token)
            except Exception as e:
                raise AuthenticationFailed(f"Refresh token invalid or expired: {e}")

            # Attach for middleware/response to update cookies
            request._new_access_token = new_access_token
            validated_token = self.get_validated_token(new_access_token)

        return self.get_user(validated_token), validated_token
