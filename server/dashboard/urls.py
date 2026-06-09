from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_view),
    path('moods/', views.moods_view),
    path('journals/', views.journal_view),
    path('chat/', views.chat_view),
    path('counsellors/', views.counsellors_view),
    path('crisis-alerts/', views.crisis_alerts_view),
    path('appointments/', views.appointments_view),
    path('messages/', views.direct_messages_view),
    path('resources/', views.resources_view),
    path('admin/overview/', views.admin_overview_view),
    path('admin/institutions/', views.institutions_view),
    path('admin/users/', views.admin_users_view),
]
