from rest_framework import serializers
from .models import HomeNurse, NursingServiceCategory


class NursingServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NursingServiceCategory
        fields = ["id", "name", "group"]


class HomeNurseCreateSerializer(serializers.ModelSerializer):
    services = serializers.PrimaryKeyRelatedField(
        many=True, queryset=NursingServiceCategory.objects.all()
    )

    class Meta:
        model = HomeNurse
        fields = [
            "nursing_level",
            "gender",
            "council_registration_number",
            "years_of_experience",
            "services",
            "preferred_working_hours",
            "emergency_availability",
            "location",
            "date_of_birth",
            "display_photo",
            "service_pricing",
        ]

    def validate_services(self, value):
        if not value:
            raise serializers.ValidationError("Select at least one nursing service category.")
        return value

    def validate_date_of_birth(self, value):
        """Ensure nurse is at least 18 years old."""
        from datetime import date

        if not value:
            return value

        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError("Home nurses must be at least 18 years old.")
        return value

    def create(self, validated_data):
        services = validated_data.pop("services", [])
        user = validated_data.pop("user")
        instance = HomeNurse.objects.create(user=user, **validated_data)
        instance.services.set(services)
        return instance

    def validate(self, attrs):
        # Require display photo on registration
        if not attrs.get("display_photo"):
            raise serializers.ValidationError({"display_photo": "Display image is required."})
        return attrs


class HomeNurseMinimalSerializer(serializers.ModelSerializer):
    services = NursingServiceCategorySerializer(many=True, read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    display_photo = serializers.ImageField(read_only=True)
    age = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    phone_number = serializers.CharField(source="user.phone_number", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = HomeNurse
        fields = [
            "id",
            "username",
            "user_id",
            "nursing_level",
            "gender",
            "council_registration_number",
            "date_of_birth",
            "age",
            "years_of_experience",
            "preferred_working_hours",
            "emergency_availability",
            "is_verified",
            "phone_number",
            "email",
            "location",
            "services",
            "display_photo",
            "service_pricing",
            "created_at",
            "updated_at",
        ]

    def get_age(self, obj):
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None


class HomeNurseUpdateSerializer(serializers.ModelSerializer):
    services = serializers.PrimaryKeyRelatedField(
        many=True, queryset=NursingServiceCategory.objects.all(), required=False
    )
    display_photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = HomeNurse
        fields = [
            "nursing_level",
            "gender",
            "council_registration_number",
            "date_of_birth",
            "years_of_experience",
            "services",
            "preferred_working_hours",
            "emergency_availability",
            "location",
            "display_photo",
            "service_pricing",
        ]

    def update(self, instance, validated_data):
        services = validated_data.pop("services", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if services is not None:
            instance.services.set(services)
        return instance


class AdminHomeNurseSerializer(serializers.ModelSerializer):
    """Lightweight serializer for admin listing."""
    username = serializers.CharField(source="user.username", read_only=True)
    user_active = serializers.BooleanField(source="user.is_active", read_only=True)
    services = NursingServiceCategorySerializer(many=True, read_only=True)
    age = serializers.SerializerMethodField()

    class Meta:
        model = HomeNurse
        fields = [
            "id",
            "username",
            "user_active",
            "is_verified",
            "nursing_level",
            "gender",
            "location",
            "date_of_birth",
            "age",
            "years_of_experience",
            "services",
            "service_pricing",
            "created_at",
            "updated_at",
        ]

    def get_age(self, obj):
        from datetime import date
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None
