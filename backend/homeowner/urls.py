from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HomeownerProfileViewSet, JobViewSet,
    JobApplicationViewSet, ReviewViewSet
)

router = DefaultRouter()
router.register(r'profiles', HomeownerProfileViewSet, basename='homeowner-profile')
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'applications', JobApplicationViewSet, basename='job-application')
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
]
