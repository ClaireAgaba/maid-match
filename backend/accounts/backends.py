from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

User = get_user_model()


class PhoneNumberBackend(ModelBackend):
    """
    Custom authentication backend that allows users to log in using their phone number
    instead of username.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Try to get phone_number from kwargs first, then fall back to username
        phone_number = kwargs.get('phone_number', username)
        
        if phone_number is None or password is None:
            return None
        
        try:
            # Try to find user by phone number
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            # If not found by phone, try by username (for backwards compatibility)
            try:
                user = User.objects.get(username=phone_number)
            except User.DoesNotExist:
                return None
        
        # Check password
        if user.check_password(password):
            return user
        
        return None
