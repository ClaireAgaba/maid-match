from rest_framework import serializers
from .models import MaidProfile, MaidAvailability
from accounts.serializers import UserSerializer


class MaidAvailabilitySerializer(serializers.ModelSerializer):
    """
    Serializer for MaidAvailability model
    """
    class Meta:
        model = MaidAvailability
        fields = ['id', 'day_of_week', 'start_time', 'end_time', 'is_available']


class MaidProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for MaidProfile model with comprehensive biodata
    """
    user = UserSerializer(read_only=True)
    availability = MaidAvailabilitySerializer(many=True, read_only=True)
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = MaidProfile
        fields = [
            'id', 'user', 
            # Bio Data & General Info
            'full_name', 'date_of_birth', 'age', 'profile_photo', 
            'location', 'latitude', 'longitude', 'phone_number', 'email',
            # Professional Info
            'bio', 'experience_years', 'hourly_rate', 'skills', 
            'availability_status', 'rating', 'total_jobs_completed',
            # Account Status
            'is_verified', 'is_enabled', 'verification_notes',
            # Documents
            'id_document', 'certificate', 
            # Related
            'availability', 'created_at', 'updated_at'
        ]
        read_only_fields = ['rating', 'total_jobs_completed', 'created_at', 'updated_at', 'age']
    
    def get_age(self, obj):
        """Calculate age from date of birth"""
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - ((today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day))
        return None


class MaidProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating MaidProfile
    """
    class Meta:
        model = MaidProfile
        fields = [
            # Bio Data & General Info
            'full_name', 'date_of_birth', 'profile_photo', 
            'location', 'latitude', 'longitude', 'phone_number', 'email',
            # Professional Info
            'bio', 'experience_years', 'hourly_rate', 'skills',
            'availability_status', 
            # Documents
            'id_document', 'certificate'
        ]


class MaidProfileListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing maids
    """
    username = serializers.CharField(source='user.username', read_only=True)
    age = serializers.SerializerMethodField()
    
    class Meta:
        model = MaidProfile
        fields = [
            'id', 'username', 'full_name', 'age', 'profile_photo', 
            'location', 'phone_number', 'email',
            'experience_years', 'hourly_rate', 'availability_status',
            'rating', 'total_jobs_completed',
            'is_verified', 'is_enabled', 'verification_notes', 'created_at'
        ]
    
    def get_age(self, obj):
        """Calculate age from date of birth"""
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - ((today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day))
        return None
