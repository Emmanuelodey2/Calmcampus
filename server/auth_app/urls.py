from django.urls import path
from . import views

urlpatterns = [
    path('institutions/', views.institutions_view),
    path('auth/signup/', views.signup_view),
    path('auth/login/', views.login_view),
    path('auth/logout/', views.logout),
    path('logout/', views.logout),
    path('authentication/', views.auth),


    # path('protected/', views.protected_view),
]
