from rest_framework import serializers
from .models import CleaningCompany, ServiceCategory, CleaningWorkImage


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "group"]


class CleaningCompanyCreateSerializer(serializers.ModelSerializer):
    services = serializers.PrimaryKeyRelatedField(many=True, queryset=ServiceCategory.objects.all())
    display_photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = CleaningCompany
        fields = [
            "company_name",
            "services",
            "location",
            "display_photo",
        ]

    def validate_services(self, value):
        if not value:
            raise serializers.ValidationError("Select at least one service category.")
        return value

    def create(self, validated_data):
        services = validated_data.pop("services", [])
        user = self.context["request"].user
        instance = CleaningCompany.objects.create(user=user, **validated_data)
        instance.services.set(services)
        return instance


class AdminCleaningCompanySerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    user_active = serializers.BooleanField(source="user.is_active", read_only=True)
    services = ServiceCategorySerializer(many=True, read_only=True)

    class Meta:
        model = CleaningCompany
        fields = [
            "id",
            "user_id",
            "username",
            "user_active",
            "company_name",
            "location",
            "verified",
            "services",
            "created_at",
            "updated_at",
        ]


class CleaningCompanyMinimalSerializer(serializers.ModelSerializer):
    services = ServiceCategorySerializer(many=True, read_only=True)
    display_photo_url = serializers.SerializerMethodField()
    username = serializers.CharField(source="user.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    phone_number = serializers.CharField(source="user.phone_number", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = CleaningCompany
        fields = [
            "id",
            "company_name",
            "location",
            "verified",
            "services",
            "display_photo_url",
            "username",
            "user_id",
            "phone_number",
            "email",
        ]

    def get_display_photo_url(self, obj):
        request = self.context.get("request")
        try:
            if obj.display_photo and hasattr(obj.display_photo, 'url'):
                url = obj.display_photo.url
                return request.build_absolute_uri(url) if request else url
        except Exception:
            pass
        return None


class CleaningWorkImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = CleaningWorkImage
        fields = ["id", "image", "image_url", "caption", "created_at"]
        read_only_fields = ["id", "created_at", "image_url"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        try:
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        except Exception:
            return None


class CleaningCompanyUpdateSerializer(serializers.ModelSerializer):
    services = serializers.PrimaryKeyRelatedField(many=True, queryset=ServiceCategory.objects.all(), required=False)
    display_photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = CleaningCompany
        fields = ["company_name", "location", "services", "display_photo"]

    def update(self, instance, validated_data):
        services = validated_data.pop("services", None)
        display_photo = validated_data.pop("display_photo", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if display_photo is not None:
            instance.display_photo = display_photo
        instance.save()
        if services is not None:
            instance.services.set(services)
        return instance
