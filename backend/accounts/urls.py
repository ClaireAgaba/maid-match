from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GetCSRFToken, UserRegistrationView, UserLoginView, UserLogoutView, UserViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # CSRF token endpoint
    path('csrf/', GetCSRFToken.as_view(), name='csrf'),
    
    # Authentication endpoints
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    
    # User management endpoints
    path('', include(router.urls)),
]
