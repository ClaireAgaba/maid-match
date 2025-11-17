from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - used for displaying user information
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'full_name', 'email', 'user_type', 'phone_number', 
            'profile_picture', 'address', 'gender', 'is_verified', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined', 'is_verified']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    Phone number is the primary identifier for local maids
    """
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'user_type', 'phone_number', 'address'
        ]
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
            'user_type': {'required': True},
            'phone_number': {'required': True},  # Primary contact
            'address': {'required': False},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if attrs['user_type'] not in ['homeowner', 'maid', 'admin']:
            raise serializers.ValidationError({"user_type": "Invalid user type. Must be 'homeowner', 'maid', or 'admin'."})
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile
    """
    class Meta:
        model = User
        fields = [
            'full_name', 'email', 'phone_number', 'profile_picture', 'address', 'gender'
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, write_only=True, label="Confirm New Password")
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
