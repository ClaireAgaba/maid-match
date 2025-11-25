from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import MaidProfile, MaidAvailability
from .serializers import MaidProfileSerializer, MaidProfileUpdateSerializer
from .serializers import MaidProfileListSerializer, MaidAvailabilitySerializer
from homeowner.models import HomeownerProfile, ClosedJob, Review
from cleaning_company.models import CleaningCompany
from home_nursing.models import HomeNurse
import csv
from datetime import date
from django.http import HttpResponse
class IsMaidOwner(permissions.BasePermission):
    """
    Custom permission to only allow maids to edit their own profile
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions are only allowed to the owner of the profile
        return obj.user == request.user


class MaidProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MaidProfile CRUD operations
    """
    queryset = MaidProfile.objects.select_related('user').all()
    permission_classes = [permissions.IsAuthenticated, IsMaidOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['availability_status', 'experience_years']
    search_fields = ['full_name', 'location', 'phone_number', 'email', 'user__username', 'skills', 'bio']
    ordering_fields = ['rating', 'hourly_rate', 'experience_years', 'total_jobs_completed', 'date_of_birth']
    ordering = ['-rating']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MaidProfileListSerializer
        elif self.action in ['update', 'partial_update']:
            return MaidProfileUpdateSerializer
        return MaidProfileSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        # Filter by max hourly rate
        max_rate = self.request.query_params.get('max_rate', None)
        if max_rate:
            queryset = queryset.filter(hourly_rate__lte=max_rate)
        
        # Filter by skills
        skills = self.request.query_params.get('skills', None)
        if skills:
            queryset = queryset.filter(skills__icontains=skills)
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        return queryset
    
    @action(detail=False, methods=['get', 'patch', 'put'])
    def me(self, request):
        """
        Get or update current maid's profile
        """
        try:
            profile = MaidProfile.objects.get(user=request.user)
            
            if request.method == 'GET':
                serializer = self.get_serializer(profile)
                return Response(serializer.data)
            
            elif request.method in ['PATCH', 'PUT']:
                partial = request.method == 'PATCH'
                serializer = MaidProfileUpdateSerializer(profile, data=request.data, partial=partial)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except MaidProfile.DoesNotExist:
            return Response({
                'error': 'Maid profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        Get list of available maids
        """
        # Only surface maids that are verified, enabled, and opted-in as available
        queryset = self.get_queryset().filter(
            availability_status=True,
            is_verified=True,
            is_enabled=True,
        )
        serializer = MaidProfileListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def recompute_rating(self, request, pk=None):
        """Recalculate and persist the maid's average rating from reviews."""
        maid = self.get_object()
        from django.db.models import Avg
        from decimal import Decimal, ROUND_HALF_UP
        avg = Review.objects.filter(reviewee=maid.user).aggregate(Avg('rating'))['rating__avg'] or 0
        maid.rating = Decimal(str(avg)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        maid.save(update_fields=['rating'])
        return Response({'rating': str(maid.rating)})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def close_job(self, request, pk=None):
        """Mark a connection as a closed job for this maid. Increments total_jobs_completed."""
        maid = self.get_object()
        maid.total_jobs_completed = (maid.total_jobs_completed or 0) + 1
        maid.save(update_fields=['total_jobs_completed'])
        # Log closed job if caller is a homeowner
        try:
            # Ensure the caller has a homeowner profile for logging purposes
            if hasattr(request.user, 'homeowner_profile'):
                homeowner = request.user.homeowner_profile
            else:
                homeowner, _ = HomeownerProfile.objects.get_or_create(user=request.user)
            ClosedJob.objects.create(homeowner=homeowner, maid=maid)
        except Exception:
            # Do not fail the call due to logging issues
            pass
        return Response({'total_jobs_completed': maid.total_jobs_completed})

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def recent_clients(self, request, pk=None):
        """Return recent homeowners who closed jobs with this maid."""
        maid = self.get_object()
        qs = ClosedJob.objects.select_related('homeowner__user').filter(maid=maid).order_by('-created_at')[:10]
        data = []
        for cj in qs:
            user = cj.homeowner.user
            # Safely build profile picture URL if available
            picture_url = None
            try:
                pic = getattr(user, 'profile_picture', None)
                if pic and hasattr(pic, 'url'):
                    # request may be needed to build absolute uri
                    if hasattr(self.request, 'build_absolute_uri'):
                        picture_url = self.request.build_absolute_uri(pic.url)
                    else:
                        picture_url = pic.url
            except Exception:
                picture_url = None
            hp = cj.homeowner
            data.append({
                'homeowner_id': hp.id,
                'username': user.username,
                'full_name': getattr(user, 'full_name', '') or user.username,
                'profile_picture': picture_url,
                'home_address': getattr(hp, 'home_address', None),
                'home_type': getattr(hp, 'home_type', None),
                'number_of_rooms': getattr(hp, 'number_of_rooms', None),
                'is_verified': getattr(hp, 'is_verified', False),
                'created_at': cj.created_at,
            })
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def admin_stats(self, request):
        """Aggregate counts for admin dashboard."""
        # Authorize admin by either is_staff or custom user_type == 'admin'
        user_type = getattr(request.user, 'user_type', '')
        if not (getattr(request.user, 'is_staff', False) or user_type == 'admin'):
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        total_maids = MaidProfile.objects.count()
        verified_maids = MaidProfile.objects.filter(is_verified=True).count()
        unverified_maids = total_maids - verified_maids
        total_homeowners = HomeownerProfile.objects.count()
        total_cleaning_companies = CleaningCompany.objects.count()
        total_home_nurses = HomeNurse.objects.count()
        temp_available = MaidProfile.objects.filter(category='temporary', availability_status=True).count()
        live_in_available = MaidProfile.objects.filter(category='live_in', availability_status=True).count()
        completed_jobs = ClosedJob.objects.count()
        return Response({
            'total_maids': total_maids,
            'verified_maids': verified_maids,
            'unverified_maids': unverified_maids,
            'total_homeowners': total_homeowners,
            'total_cleaning_companies': total_cleaning_companies,
            'total_home_nurses': total_home_nurses,
            'temporary_available_maids': temp_available,
            'live_in_available_maids': live_in_available,
            'completed_jobs': completed_jobs,
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def export_maids(self, request):
        """Export maids to CSV: Name, Age, Gender, Phone number, Location."""
        user_type = getattr(request.user, 'user_type', '')
        if not (getattr(request.user, 'is_staff', False) or user_type == 'admin'):
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

        def calc_age(dob):
            try:
                if not dob:
                    return ''
                today = date.today()
                return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            except Exception:
                return ''

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="maids_export.csv"'
        writer = csv.writer(response)
        writer.writerow(['Name', 'Age', 'Gender', 'Phone number', 'Location'])
        for m in MaidProfile.objects.select_related('user').all():
            name = m.full_name or getattr(m.user, 'full_name', '') or m.user.username
            age = calc_age(m.date_of_birth)
            gender = getattr(m.user, 'gender', '') or ''
            phone = m.phone_number or getattr(m.user, 'phone_number', '') or ''
            location = m.location or ''
            writer.writerow([name, age, gender, phone, location])
        return response
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def verify(self, request, pk=None):
        """
        Admin action to verify a maid account
        """
        maid = self.get_object()
        notes = request.data.get('verification_notes', '')
        
        maid.is_verified = True
        maid.verification_notes = notes
        maid.save()
        
        serializer = self.get_serializer(maid)
        return Response({
            'message': 'Maid account verified successfully',
            'maid': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def unverify(self, request, pk=None):
        """
        Admin action to unverify a maid account
        """
        maid = self.get_object()
        
        maid.is_verified = False
        maid.save()
        
        serializer = self.get_serializer(maid)
        return Response({
            'message': 'Maid account unverified',
            'maid': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def disable(self, request, pk=None):
        """
        Admin action to disable a maid account
        """
        maid = self.get_object()
        reason = request.data.get('reason', '')
        
        maid.is_enabled = False
        if reason:
            maid.verification_notes = f"Disabled: {reason}"
        maid.save()
        
        serializer = self.get_serializer(maid)
        return Response({
            'message': 'Maid account disabled',
            'maid': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def enable(self, request, pk=None):
        """
        Admin action to enable a maid account
        """
        maid = self.get_object()
        
        maid.is_enabled = True
        maid.save()
        
        serializer = self.get_serializer(maid)
        return Response({
            'message': 'Maid account enabled',
            'maid': serializer.data
        })


class MaidAvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MaidAvailability CRUD operations
    """
    queryset = MaidAvailability.objects.all()
    serializer_class = MaidAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Maids can only see their own availability
        if hasattr(self.request.user, 'maid_profile'):
            return MaidAvailability.objects.filter(maid=self.request.user.maid_profile)
        return MaidAvailability.objects.none()
    
    def perform_create(self, serializer):
        # Automatically set the maid to the current user's profile
        serializer.save(maid=self.request.user.maid_profile)
