from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import MaidProfile, MaidAvailability
from .serializers import (
    MaidProfileSerializer, MaidProfileUpdateSerializer,
    MaidProfileListSerializer, MaidAvailabilitySerializer
)


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
        queryset = self.get_queryset().filter(availability_status=True)
        serializer = MaidProfileListSerializer(queryset, many=True)
        return Response(serializer.data)
    
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
