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
            'bio', 'experience_years', 'hourly_rate', 'category', 'skills', 'service_pricing',
            'availability_status', 'rating', 'total_jobs_completed',
            'onboarding_fee_paid', 'onboarding_fee_paid_at',
            # Account Status
            'is_verified', 'is_enabled', 'verification_notes',
            # Documents
            'id_document', 'certificate', 
            # Related
            'availability', 'created_at', 'updated_at'
        ]
        read_only_fields = ['rating', 'total_jobs_completed', 'onboarding_fee_paid', 'onboarding_fee_paid_at', 'created_at', 'updated_at', 'age']
    
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
            'bio', 'experience_years', 'hourly_rate', 'category', 'skills', 'service_pricing',
            'availability_status', 
            # Documents
            'id_document', 'certificate'
        ]


class MaidProfileListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing maids
    """
    username = serializers.CharField(source='user.username', read_only=True)
    gender = serializers.CharField(source='user.gender', read_only=True)
    age = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    
    class Meta:
        model = MaidProfile
        fields = [
            'id', 'username', 'full_name', 'gender', 'age', 'profile_photo', 'category',
            'location', 'phone_number', 'email', 'skills', 'service_pricing', 'bio',
            'experience_years', 'hourly_rate', 'availability_status',
            'rating', 'total_jobs_completed', 'distance_km',
            'is_verified', 'is_enabled', 'verification_notes',
            'id_document', 'certificate',
            'created_at'
        ]
    
    def get_age(self, obj):
        """Calculate age from date of birth"""
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - ((today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day))
        return None

    def get_distance_km(self, obj):
        """Compute distance from current homeowner (if any) to this maid in km.

        Uses live GPS (current_latitude/current_longitude) when available,
        otherwise falls back to base latitude/longitude. Returns None if we
        don't have coordinates for either side.
        """
        request = self.context.get('request')
        if not request:
            return None
        user = getattr(request, 'user', None)
        homeowner = getattr(user, 'homeowner_profile', None)
        if homeowner is None:
            return None

        ref_lat = homeowner.current_latitude or homeowner.latitude
        ref_lon = homeowner.current_longitude or homeowner.longitude
        m_lat = obj.current_latitude or obj.latitude
        m_lon = obj.current_longitude or obj.longitude
        if ref_lat is None or ref_lon is None or m_lat is None or m_lon is None:
            return None

        from math import radians, sin, cos, asin, sqrt
        try:
            lat1 = float(ref_lat)
            lon1 = float(ref_lon)
            lat2 = float(m_lat)
            lon2 = float(m_lon)
        except (TypeError, ValueError):
            return None

        rlat1, rlon1, rlat2, rlon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlon = rlon2 - rlon1
        dlat = rlat2 - rlat1
        a = sin(dlat / 2) ** 2 + cos(rlat1) * cos(rlat2) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))
        r = 6371
        return round(r * c, 3)
