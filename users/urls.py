from django.urls import path, include
from django.contrib.auth import views as auth_views
from rest_framework.routers import DefaultRouter
from . import views, api_views

router = DefaultRouter()
router.register(r'api/users', api_views.UserViewSet)
router.register(r'api/custom-roles', api_views.CustomRoleViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Authentication URLs
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='users/logout.html', next_page='home'), name='logout'),

    # Profile URLs
    path('profile/', views.profile_view, name='profile'),
    path('account-settings/', views.account_settings_view, name='account_settings'),
    path('update-profile/', views.update_profile, name='update_profile'),
    path('change-password/', views.change_password, name='change_password'),
    path('update-avatar/', views.update_avatar, name='update_avatar'),
    path('update-preferences/', views.update_preferences, name='update_preferences'),

    # Password reset URLs
    path('password-reset/',
         views.CustomPasswordResetView.as_view(),
         name='password_reset'),
    path('password-reset/done/',
         views.CustomPasswordResetDoneView.as_view(),
         name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/',
         views.CustomPasswordResetConfirmView.as_view(),
         name='password_reset_confirm'),
    path('password-reset-complete/',
         views.CustomPasswordResetCompleteView.as_view(),
         name='password_reset_complete'),

    # Notification URLs
    path('notifications/', views.notifications_view, name='notifications'),
    path('notifications/mark-read/<int:notification_id>/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/mark-all-read/', views.mark_all_read, name='mark_all_read'),
    path('notifications/count/', views.get_notifications_count, name='get_notifications_count'),

    # User management URLs
    path('users/', views.user_list, name='user_list'),
    path('users/create/', views.user_create, name='user_create'),
    path('users/<int:user_id>/', views.user_detail, name='user_detail'),
    path('users/<int:user_id>/edit/', views.user_edit, name='user_edit'),
    path('users/<int:user_id>/delete/', views.user_delete, name='user_delete'),
    path('users/<int:user_id>/change-role/', views.change_user_role, name='change_user_role'),
    path('users/<int:user_id>/toggle-status/', views.toggle_user_status, name='toggle_user_status'),
    path('permissions/', views.permissions_management, name='permissions_management'),
    path('debug/', views.debug_user_info, name='debug_user_info'),
    path('test-permissions/', views.test_permissions, name='test_permissions'),
]
