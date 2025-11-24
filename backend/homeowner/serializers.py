from rest_framework import serializers
from .models import HomeownerProfile, Job, JobApplication, Review
from maid.models import MaidProfile
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
            'is_verified', 'is_active', 'verification_notes',
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
                  'id_document', 'lc_letter', 'verification_notes']


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
            'rating', 'punctuality', 'quality', 'communication', 'reliability',
            'respect_communication', 'payment_timeliness', 'safety_environment', 'fairness_workload',
            'comment', 'created_at'
        ]
        read_only_fields = ['reviewer', 'reviewee', 'created_at']


class ReviewCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Review
    """
    # Allow frontend to send maid_id and we resolve to the maid's user as reviewee
    maid_id = serializers.IntegerField(write_only=True, required=False, help_text="MaidProfile ID to review")
    homeowner_id = serializers.IntegerField(write_only=True, required=False, help_text="HomeownerProfile ID to review")
    class Meta:
        model = Review
        fields = [
            'job', 'reviewee', 'rating', 'comment', 'maid_id', 'homeowner_id',
            'punctuality', 'quality', 'communication', 'reliability',
            'respect_communication', 'payment_timeliness', 'safety_environment', 'fairness_workload'
        ]
        extra_kwargs = {
            'reviewee': {'required': False},
            'rating': {'required': False, 'read_only': True}
        }
    
    def _validate_star(self, value, name):
        if value is None:
            raise serializers.ValidationError({name: 'This field is required'})
        try:
            iv = int(value)
        except Exception:
            raise serializers.ValidationError({name: 'Must be an integer between 1 and 5'})
        if iv < 1 or iv > 5:
            raise serializers.ValidationError({name: 'Must be between 1 and 5'})
        return iv

    def validate(self, attrs):
        # Ensure target provided
        if not attrs.get('reviewee') and not attrs.get('maid_id') and not attrs.get('homeowner_id'):
            raise serializers.ValidationError("Provide either 'reviewee', 'maid_id', or 'homeowner_id'.")

        # Two possible rating schemes: for maids or for homeowners.
        has_maid_subs = all(attrs.get(k) is not None for k in ['punctuality','quality','communication','reliability'])
        has_home_subs = all(attrs.get(k) is not None for k in ['respect_communication','payment_timeliness','safety_environment','fairness_workload'])

        if has_maid_subs and has_home_subs:
            raise serializers.ValidationError('Provide only one set of subratings (maid OR homeowner).')

        if has_maid_subs:
            attrs['punctuality'] = self._validate_star(attrs.get('punctuality'), 'punctuality')
            attrs['quality'] = self._validate_star(attrs.get('quality'), 'quality')
            attrs['communication'] = self._validate_star(attrs.get('communication'), 'communication')
            attrs['reliability'] = self._validate_star(attrs.get('reliability'), 'reliability')
        elif has_home_subs:
            attrs['respect_communication'] = self._validate_star(attrs.get('respect_communication'), 'respect_communication')
            attrs['payment_timeliness'] = self._validate_star(attrs.get('payment_timeliness'), 'payment_timeliness')
            attrs['safety_environment'] = self._validate_star(attrs.get('safety_environment'), 'safety_environment')
            attrs['fairness_workload'] = self._validate_star(attrs.get('fairness_workload'), 'fairness_workload')
        else:
            raise serializers.ValidationError('Provide all four subratings for either maid or homeowner review.')
        return attrs

    def create(self, validated_data):
        maid_id = validated_data.pop('maid_id', None)
        homeowner_id = validated_data.pop('homeowner_id', None)
        if maid_id and not validated_data.get('reviewee'):
            try:
                maid = MaidProfile.objects.select_related('user').get(id=maid_id)
                validated_data['reviewee'] = maid.user
            except MaidProfile.DoesNotExist:
                raise serializers.ValidationError({ 'maid_id': 'Maid not found' })
        if homeowner_id and not validated_data.get('reviewee'):
            from .models import HomeownerProfile
            try:
                hp = HomeownerProfile.objects.select_related('user').get(id=homeowner_id)
                validated_data['reviewee'] = hp.user
            except HomeownerProfile.DoesNotExist:
                raise serializers.ValidationError({ 'homeowner_id': 'Homeowner not found' })
        # Compute overall rating as the average of four categories (rounded to nearest int)
        if all(k in validated_data for k in ['punctuality','quality','communication','reliability']):
            subs = [validated_data.get('punctuality'), validated_data.get('quality'), validated_data.get('communication'), validated_data.get('reliability')]
        else:
            subs = [validated_data.get('respect_communication'), validated_data.get('payment_timeliness'), validated_data.get('safety_environment'), validated_data.get('fairness_workload')]
        avg = sum(subs) / 4.0
        overall = int(round(avg))
        overall = max(1, min(5, overall))
        validated_data['rating'] = overall
        # job is optional (nullable)
        return Review.objects.create(**validated_data)
