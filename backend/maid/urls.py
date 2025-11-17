from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaidProfileViewSet, MaidAvailabilityViewSet

router = DefaultRouter()
router.register(r'profiles', MaidProfileViewSet, basename='maid-profile')
router.register(r'availability', MaidAvailabilityViewSet, basename='maid-availability')

urlpatterns = [
    path('', include(router.urls)),
]
