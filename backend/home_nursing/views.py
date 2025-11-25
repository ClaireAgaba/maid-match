from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser

from .models import NursingServiceCategory, HomeNurse
from .serializers import (
    NursingServiceCategorySerializer,
    HomeNurseCreateSerializer,
    HomeNurseMinimalSerializer,
    HomeNurseUpdateSerializer,
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
    queryset = HomeNurse.objects.all()
    serializer_class = HomeNurseCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]


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
