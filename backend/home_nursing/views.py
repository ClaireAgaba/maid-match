from django.contrib.auth import get_user_model
from rest_framework import permissions
from rest_framework.exceptions import ValidationError


class IsAdminOrUserTypeAdmin(permissions.BasePermission):
    """Allow Django staff OR custom accounts.user_type == 'admin'"""
    def has_permission(self, request, view):
        try:
            return bool(getattr(request.user, "is_staff", False) or getattr(request.user, "user_type", "") == "admin")
        except Exception:
            return False

from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework import status

from .models import NursingServiceCategory, HomeNurse
from .serializers import (
    NursingServiceCategorySerializer,
    HomeNurseCreateSerializer,
    HomeNurseMinimalSerializer,
    HomeNurseUpdateSerializer,
    AdminHomeNurseSerializer,
)


class HomeNursingPingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok", "app": "home_nursing"})


class NursingServiceCategoryGroupedList(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        groups = (
            (NursingServiceCategory.GROUP_ELDERLY, "Elderly Care"),
            (NursingServiceCategory.GROUP_POST_SURGERY, "Post-Surgery Care"),
            (NursingServiceCategory.GROUP_SPECIAL_NEEDS, "Special Needs Care"),
            (NursingServiceCategory.GROUP_BABY_INFANT, "Baby & Infant Care"),
            (NursingServiceCategory.GROUP_PALLIATIVE, "Palliative Care (End-of-life)"),
            (NursingServiceCategory.GROUP_HOME_MEDICAL, "Home Medical Support"),
        )
        data = {}
        for key, label in groups:
            qs = NursingServiceCategory.objects.filter(group=key).order_by("name")
            data[label] = NursingServiceCategorySerializer(qs, many=True).data
        return Response(data)


class HomeNurseRegisterView(generics.CreateAPIView):
    """Create a HomeNurse profile for a given phone_number.

    We do not require JWT auth here (similar to the earlier flow) so that
    nurse profile creation during registration works reliably from the mobile
    app. Instead, we resolve the User by phone_number and attach it when
    saving the serializer.
    """

    queryset = HomeNurse.objects.all()
    serializer_class = HomeNurseCreateSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        phone = self.request.data.get("phone_number")
        if not phone:
            raise ValidationError({"phone_number": ["phone_number is required."]})

        try:
            user = User.objects.get(phone_number=phone, user_type="home_nurse")
        except User.DoesNotExist:
            raise ValidationError({"phone_number": ["No home nurse user found with this phone number."]})

        serializer.save(user=user)


class MyHomeNurseView(generics.RetrieveUpdateAPIView):
    """Get or update the current user's nurse profile."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return HomeNurse.objects.get(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return HomeNurseUpdateSerializer
        return HomeNurseMinimalSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class MyHomeNurseLocationView(APIView):
    """Update live GPS location for the current nurse.

    Expects JSON body like {"current_latitude": 0.0, "current_longitude": 0.0}.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            nurse = HomeNurse.objects.get(user=request.user)
        except HomeNurse.DoesNotExist:
            return Response({"detail": "Home nurse profile not found"}, status=status.HTTP_404_NOT_FOUND)

        lat = request.data.get("current_latitude")
        lng = request.data.get("current_longitude")
        if lat is None or lng is None:
            return Response({"detail": "current_latitude and current_longitude are required"}, status=status.HTTP_400_BAD_REQUEST)

        nurse.current_latitude = lat
        nurse.current_longitude = lng
        nurse.save(update_fields=["current_latitude", "current_longitude"])
        return Response({"detail": "Location updated"}, status=status.HTTP_200_OK)


class AdminHomeNurseListView(generics.ListAPIView):
    """Admin list of home nurses with basic filters and pagination."""
    serializer_class = AdminHomeNurseSerializer
    permission_classes = [IsAdminOrUserTypeAdmin]

    def get_queryset(self):
        qs = HomeNurse.objects.select_related("user").prefetch_related("services").order_by("-created_at")
        level = self.request.query_params.get("level")
        if level in (HomeNurse.LEVEL_ENROLLED, HomeNurse.LEVEL_REGISTERED, HomeNurse.LEVEL_MIDWIFE):
            qs = qs.filter(nursing_level=level)
        search = self.request.query_params.get("q")
        if search:
            qs = qs.filter(user__username__icontains=search) | qs.filter(location__icontains=search)
        return qs


class AdminHomeNurseActionsView(generics.GenericAPIView):
    """Admin actions on a single nurse: verify/unverify, enable/disable."""
    permission_classes = [IsAdminOrUserTypeAdmin]
    queryset = HomeNurse.objects.select_related("user").all()
    serializer_class = AdminHomeNurseSerializer

    def post(self, request, pk, action_name):
        nurse = self.get_queryset().get(pk=pk)
        if action_name == "verify":
            nurse.is_verified = True
            nurse.save(update_fields=["is_verified"])
            return Response({"message": "Nurse verified"})
        if action_name == "unverify":
            nurse.is_verified = False
            nurse.save(update_fields=["is_verified"])
            return Response({"message": "Nurse unverified"})
        if action_name == "enable":
            nurse.user.is_active = True
            nurse.user.save(update_fields=["is_active"])
            return Response({"message": "Nurse account enabled"})
        if action_name == "disable":
            nurse.user.is_active = False
            nurse.user.save(update_fields=["is_active"])
            return Response({"message": "Nurse account disabled"})
        return Response({"detail": "Unknown action"}, status=status.HTTP_400_BAD_REQUEST)


class PublicNurseBrowseList(generics.ListAPIView):
    """Public browse: only verified and active nurses."""
    permission_classes = [permissions.AllowAny]
    serializer_class = HomeNurseMinimalSerializer

    def get_queryset(self):
        qs = (
            HomeNurse.objects.select_related("user")
            .prefetch_related("services")
            .filter(is_verified=True, user__is_active=True)
            .order_by("-created_at")
        )
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(user__username__icontains=q) | qs.filter(location__icontains=q)
        level = self.request.query_params.get("level")
        if level in (HomeNurse.LEVEL_ENROLLED, HomeNurse.LEVEL_REGISTERED, HomeNurse.LEVEL_MIDWIFE):
            qs = qs.filter(nursing_level=level)
        return qs
