from rest_framework import serializers
from .models import HomeownerProfile, Job, JobApplication, Review
from accounts.serializers import UserSerializer
from maid.serializers import MaidProfileListSerializer


class HomeownerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for HomeownerProfile model
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = HomeownerProfile
        fields = [
            'id', 'user', 'home_address', 'home_type', 'number_of_rooms',
            'preferred_maid_gender', 'id_document', 'lc_letter',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class HomeownerProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating HomeownerProfile
    """
    class Meta:
        model = HomeownerProfile
        fields = ['home_address', 'home_type', 'number_of_rooms', 'preferred_maid_gender', 
                  'id_document', 'lc_letter']


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for Job model
    """
    homeowner = HomeownerProfileSerializer(read_only=True)
    assigned_maid = MaidProfileListSerializer(read_only=True)
    applications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'homeowner', 'title', 'description', 'location',
            'job_date', 'start_time', 'end_time', 'hourly_rate',
            'status', 'assigned_maid', 'applications_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['homeowner', 'status', 'assigned_maid', 'created_at', 'updated_at']
    
    def get_applications_count(self, obj):
        return obj.applications.count()


class JobCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating Job
    """
    class Meta:
        model = Job
        fields = [
            'title', 'description', 'location', 'job_date',
            'start_time', 'end_time', 'hourly_rate'
        ]


class JobListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing jobs
    """
    homeowner_name = serializers.CharField(source='homeowner.user.username', read_only=True)
    applications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'homeowner_name', 'title', 'location', 'job_date',
            'start_time', 'end_time', 'hourly_rate', 'status',
            'applications_count', 'created_at'
        ]
    
    def get_applications_count(self, obj):
        return obj.applications.count()


class JobApplicationSerializer(serializers.ModelSerializer):
    """
    Serializer for JobApplication model
    """
    job = JobListSerializer(read_only=True)
    maid = MaidProfileListSerializer(read_only=True)
    
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'maid', 'cover_letter', 'proposed_rate',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['maid', 'status', 'created_at', 'updated_at']


class JobApplicationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating JobApplication
    """
    class Meta:
        model = JobApplication
        fields = ['job', 'cover_letter', 'proposed_rate']


class ReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for Review model
    """
    reviewer = UserSerializer(read_only=True)
    reviewee = UserSerializer(read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'job', 'job_title', 'reviewer', 'reviewee',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = ['reviewer', 'reviewee', 'created_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Review
    """
    class Meta:
        model = Review
        fields = ['job', 'reviewee', 'rating', 'comment']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
