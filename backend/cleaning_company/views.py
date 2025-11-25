from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import ServiceCategory, CleaningCompany, CleaningWorkImage
from .serializers import (
    ServiceCategorySerializer,
    CleaningCompanyCreateSerializer,
    CleaningCompanyMinimalSerializer,
    CleaningCompanyUpdateSerializer,
    CleaningWorkImageSerializer,
    AdminCleaningCompanySerializer,
)


class CleaningCompanyPingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok", "app": "cleaning_company"})


class ServiceCategoryGroupedList(APIView):
    """Return categories grouped into the Uganda-context sections."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        groups = (
            (ServiceCategory.GROUP_HOUSE, "House Cleaning Services"),
            (ServiceCategory.GROUP_EXTERNAL, "External / Compound Services"),
            (ServiceCategory.GROUP_FUMIGATION, "Fumigation / Pest Control"),
            (ServiceCategory.GROUP_COMMERCIAL, "Commercial / Office Cleaning"),
            (ServiceCategory.GROUP_LAUNDRY, "Laundry Services"),
        )
        data = {}
        for key, label in groups:
            qs = ServiceCategory.objects.filter(group=key).order_by("name")
            data[label] = ServiceCategorySerializer(qs, many=True).data
        return Response(data)


class CleaningCompanyRegisterView(generics.CreateAPIView):
    """Create a CleaningCompany profile for the current user.

    Requires: company_name, location, services[]
    """
    queryset = CleaningCompany.objects.all()
    serializer_class = CleaningCompanyCreateSerializer
    permission_classes = [permissions.IsAuthenticated]


class MyCleaningCompanyView(generics.RetrieveUpdateAPIView):
    """Get or update current user's cleaning company profile.

    GET returns minimal profile; PATCH updates company_name, location, services.
    """
    serializer_class = CleaningCompanyMinimalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return CleaningCompany.objects.get(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return CleaningCompanyUpdateSerializer
        return CleaningCompanyMinimalSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class AdminCompanyListView(generics.ListAPIView):
    """Admin list of cleaning companies with filters and global counts."""
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminCleaningCompanySerializer

    def get_queryset(self):
        qs = CleaningCompany.objects.select_related("user").prefetch_related("services").order_by("-created_at")
        verified = self.request.query_params.get("verified")
        if verified in ("true", "false"):
            qs = qs.filter(verified=(verified == "true"))
        active = self.request.query_params.get("active")
        if active in ("true", "false"):
            qs = qs.filter(user__is_active=(active == "true"))
        search = self.request.query_params.get("q")
        if search:
            qs = qs.filter(company_name__icontains=search)
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        base_qs = CleaningCompany.objects.select_related("user")
        counts = {
            "total": base_qs.count(),
            "verified": base_qs.filter(verified=True).count(),
            "unverified": base_qs.filter(verified=False).count(),
            "active": base_qs.filter(user__is_active=True).count(),
            "disabled": base_qs.filter(user__is_active=False).count(),
        }
        if isinstance(response.data, dict):
            response.data["counts"] = counts
        else:
            response.data = {"results": response.data, "counts": counts}
        return response


class AdminCompanyBulkUpdateView(APIView):
    """Bulk verify/unverify and enable/disable companies: { ids: [], verified?, enable? }"""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ids = request.data.get("ids", [])
        if not isinstance(ids, list) or not ids:
            return Response({"detail": "Provide ids as a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)
        verified = request.data.get("verified")
        enable = request.data.get("enable")
        qs = CleaningCompany.objects.select_related("user").filter(id__in=ids)
        updated = 0
        if verified is not None:
            updated += qs.update(verified=bool(verified))
        if enable is not None:
            for c in qs:
                c.user.is_active = bool(enable)
                c.user.save(update_fields=["is_active"])
        return Response({"updated": updated, "count": qs.count()})


class CompanyGalleryListView(generics.ListAPIView):
    """List gallery images for current user's company (read-only)."""
    serializer_class = CleaningWorkImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CleaningWorkImage.objects.filter(company__user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class CompanyGalleryListCreateView(generics.ListCreateAPIView):
    """List and upload gallery images for current user's company."""
    serializer_class = CleaningWorkImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return CleaningWorkImage.objects.filter(company__user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        company = CleaningCompany.objects.get(user=self.request.user)
        serializer.save(company=company)


class CompanyGalleryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CleaningWorkImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return CleaningWorkImage.objects.filter(company__user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
