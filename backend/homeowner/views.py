from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import HomeownerProfile, Job, JobApplication, Review, ClosedJob
from .serializers import (
    HomeownerProfileSerializer, HomeownerProfileUpdateSerializer,
    JobSerializer, JobCreateUpdateSerializer, JobListSerializer,
    JobApplicationSerializer, JobApplicationCreateSerializer,
    ReviewSerializer, ReviewCreateSerializer
)
from maid.models import MaidProfile


class IsHomeownerOwner(permissions.BasePermission):
    """
    Custom permission to only allow homeowners to edit their own profile
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class HomeownerProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for HomeownerProfile CRUD operations
    """
    queryset = HomeownerProfile.objects.select_related('user').all()
    permission_classes = [permissions.IsAuthenticated, IsHomeownerOwner]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return HomeownerProfileUpdateSerializer
        return HomeownerProfileSerializer

    def get_permissions(self):
        # Admin-only for verification/activation endpoints
        if self.action in ['verify', 'unverify', 'activate', 'deactivate']:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """
        Get current homeowner's profile
        """
        try:
            profile = HomeownerProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except HomeownerProfile.DoesNotExist:
            return Response({
                'error': 'Homeowner profile not found'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def recent_maids(self, request):
        """Return recent maids this homeowner has closed jobs with."""
        try:
            hp = HomeownerProfile.objects.select_related('user').get(user=request.user)
        except HomeownerProfile.DoesNotExist:
            return Response({'detail': 'Homeowner profile not found'}, status=status.HTTP_404_NOT_FOUND)
        qs = ClosedJob.objects.select_related('maid__user').filter(homeowner=hp).order_by('-created_at')[:10]
        data = []
        for cj in qs:
            maid = cj.maid
            user = maid.user
            data.append({
                'maid_id': maid.id,
                'username': user.username,
                'full_name': maid.full_name or user.username,
                'phone_number': maid.phone_number,
                'location': maid.location,
                'rating': str(maid.rating),
                'total_jobs_completed': maid.total_jobs_completed,
                'created_at': cj.created_at,
                'profile_photo': maid.profile_photo.url if maid.profile_photo else None,
            })
        return Response(data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Admin verifies a homeowner account"""
        profile = self.get_object()
        notes = request.data.get('verification_notes', '')
        profile.is_verified = True
        if notes:
            profile.verification_notes = notes
        profile.save()
        return Response({'message': 'Homeowner verified', 'profile': HomeownerProfileSerializer(profile).data})

    @action(detail=True, methods=['post'])
    def unverify(self, request, pk=None):
        """Admin removes verification"""
        profile = self.get_object()
        profile.is_verified = False
        profile.save()
        return Response({'message': 'Homeowner unverified', 'profile': HomeownerProfileSerializer(profile).data})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Admin activates homeowner account"""
        profile = self.get_object()
        profile.is_active = True
        profile.save()
        return Response({'message': 'Homeowner activated', 'profile': HomeownerProfileSerializer(profile).data})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Admin deactivates homeowner account"""
        profile = self.get_object()
        reason = request.data.get('reason', '')
        profile.is_active = False
        if reason:
            existing = (profile.verification_notes or '')
            profile.verification_notes = (existing + f"\nDeactivated reason: {reason}").strip()
        profile.save()
        return Response({'message': 'Homeowner deactivated', 'profile': HomeownerProfileSerializer(profile).data})


class JobViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Job CRUD operations
    """
    queryset = Job.objects.select_related('homeowner', 'assigned_maid').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'job_date']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['job_date', 'hourly_rate', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return JobCreateUpdateSerializer
        return JobSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Homeowners see their own jobs
        if hasattr(user, 'homeowner_profile'):
            return queryset.filter(homeowner=user.homeowner_profile)
        
        # Maids see open jobs or jobs assigned to them
        if hasattr(user, 'maid_profile'):
            return queryset.filter(
                status__in=['open', 'assigned']
            ) | queryset.filter(assigned_maid=user.maid_profile)
        
        # Admins see all jobs
        if user.is_staff:
            return queryset
        
        return queryset.filter(status='open')
    
    def perform_create(self, serializer):
        # Automatically set the homeowner to the current user's profile
        serializer.save(homeowner=self.request.user.homeowner_profile)
    
    @action(detail=True, methods=['post'])
    def assign_maid(self, request, pk=None):
        """
        Assign a maid to a job
        """
        job = self.get_object()
        
        # Only homeowner can assign maid to their job
        if job.homeowner.user != request.user:
            return Response({
                'error': 'You can only assign maids to your own jobs'
            }, status=status.HTTP_403_FORBIDDEN)
        
        maid_id = request.data.get('maid_id')
        if not maid_id:
            return Response({
                'error': 'maid_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            maid = MaidProfile.objects.get(id=maid_id)
            job.assigned_maid = maid
            job.status = 'assigned'
            job.save()
            
            return Response({
                'message': 'Maid assigned successfully',
                'job': JobSerializer(job).data
            }, status=status.HTTP_200_OK)
        except MaidProfile.DoesNotExist:
            return Response({
                'error': 'Maid not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update job status
        """
        job = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Job.STATUS_CHOICES):
            return Response({
                'error': 'Invalid status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        job.status = new_status
        job.save()
        
        return Response({
            'message': 'Job status updated successfully',
            'job': JobSerializer(job).data
        }, status=status.HTTP_200_OK)


class JobApplicationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for JobApplication CRUD operations
    """
    queryset = JobApplication.objects.select_related('job', 'maid').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return JobApplicationCreateSerializer
        return JobApplicationSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Maids see their own applications
        if hasattr(user, 'maid_profile'):
            return self.queryset.filter(maid=user.maid_profile)
        
        # Homeowners see applications for their jobs
        if hasattr(user, 'homeowner_profile'):
            return self.queryset.filter(job__homeowner=user.homeowner_profile)
        
        return self.queryset.none()
    
    def perform_create(self, serializer):
        # Automatically set the maid to the current user's profile
        serializer.save(maid=self.request.user.maid_profile)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        Accept a job application
        """
        application = self.get_object()
        
        # Only homeowner can accept applications for their jobs
        if application.job.homeowner.user != request.user:
            return Response({
                'error': 'You can only accept applications for your own jobs'
            }, status=status.HTTP_403_FORBIDDEN)
        
        application.status = 'accepted'
        application.save()
        
        # Assign the maid to the job
        application.job.assigned_maid = application.maid
        application.job.status = 'assigned'
        application.job.save()
        
        # Reject other applications for this job
        JobApplication.objects.filter(job=application.job).exclude(id=application.id).update(status='rejected')
        
        return Response({
            'message': 'Application accepted successfully',
            'application': JobApplicationSerializer(application).data
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject a job application
        """
        application = self.get_object()
        
        # Only homeowner can reject applications for their jobs
        if application.job.homeowner.user != request.user:
            return Response({
                'error': 'You can only reject applications for your own jobs'
            }, status=status.HTTP_403_FORBIDDEN)
        
        application.status = 'rejected'
        application.save()
        
        return Response({
            'message': 'Application rejected successfully',
            'application': JobApplicationSerializer(application).data
        }, status=status.HTTP_200_OK)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Review CRUD operations
    """
    queryset = Review.objects.select_related('job', 'reviewer', 'reviewee').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['rating', 'reviewee']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer
    
    def perform_create(self, serializer):
        # Automatically set the reviewer to the current user
        review = serializer.save(reviewer=self.request.user)
        # If reviewee is a maid, update maid's average rating
        try:
            if hasattr(review.reviewee, 'maid_profile'):
                maid_profile = review.reviewee.maid_profile
                from django.db.models import Avg
                from decimal import Decimal, ROUND_HALF_UP
                avg = Review.objects.filter(reviewee=review.reviewee).aggregate(Avg('rating'))['rating__avg'] or 0
                maid_profile.rating = Decimal(str(avg)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                maid_profile.save(update_fields=['rating'])
        except Exception:
            # Do not block response on rating update errors
            pass

    @action(detail=False, methods=['get'])
    def mine(self, request):
        """List reviews received by the current user (e.g., a maid seeing their reviews)."""
        qs = self.queryset.filter(reviewee=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ReviewSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ReviewSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def given(self, request):
        """List reviews the current user has written (e.g., homeowner history)."""
        qs = self.queryset.filter(reviewer=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = ReviewSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ReviewSerializer(qs, many=True)
        return Response(serializer.data)
