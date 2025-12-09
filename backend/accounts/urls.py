from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GetCSRFToken, UserRegistrationView, PasswordLoginView, UserLoginView, UserLogoutView, UserViewSet,
    SendLoginPinView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # CSRF token endpoint
    path('csrf/', GetCSRFToken.as_view(), name='csrf'),
    
    # Authentication endpoints
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', PasswordLoginView.as_view(), name='login'),
    path('login/send-pin/', SendLoginPinView.as_view(), name='login-send-pin'),
    path('login/verify-pin/', UserLoginView.as_view(), name='login-verify-pin'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    
    # User management endpoints
    path('', include(router.urls)),
]
