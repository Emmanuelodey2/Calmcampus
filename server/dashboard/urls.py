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
    path('notifications/', views.notifications_view),
    path('notifications/count/', views.notifications_count_view),
    path('notifications/mark-read/', views.notifications_mark_read_view),
    path('resources/', views.resources_view),
    path('student-resources/', views.student_resources_view),
    path('counsellor/', views.counsellor_dashboard_view),
    path('counsellor/students/', views.counsellor_students_view),
    path('counsellor/students/<int:student_id>/', views.counsellor_student_detail_view),
    path('counsellor/notes/', views.counsellor_notes_view),
    path('admin/overview/', views.admin_overview_view),
    path('admin/institutions/', views.institutions_view),
    path('admin/users/', views.admin_users_view),
    path('feedback/', views.feedback_view),
    path('profile/', views.profile_view),
]
