from django.urls import path
from . import views

urlpatterns = [
    path('institutions/', views.institutions_view),
    path('auth/signup/', views.signup_view),
    path('auth/login/', views.login_view),
    path('auth/logout/', views.logout),
    path('auth/verify-email/', views.verify_email),
    path('auth/request-password-reset/', views.request_password_reset),
    path('auth/reset-password/', views.reset_password),
    path('authentication/', views.auth),
]

# APPEND_SLASH = False  # Let Django handle trailing slash redirects
