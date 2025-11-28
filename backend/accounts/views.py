from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import timedelta
import random
import requests
from django.conf import settings
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, LoginSerializer, SendLoginPinSerializer,
    VerifyLoginPinSerializer
)
from maid.models import MaidProfile
from homeowner.models import HomeownerProfile
from .models import LoginOTP

User = get_user_model()


def send_whatsapp_message(phone_number, message):
    access_token = getattr(settings, 'WHATSAPP_ACCESS_TOKEN', None)
    phone_number_id = getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', None)
    if not access_token or not phone_number_id:
        print("[WhatsApp] Missing configuration: access_token or phone_number_id not set")
        return

    url = f"https://graph.facebook.com/v20.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {"body": message},
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        print(f"[WhatsApp] Sent message to {phone_number}: status={resp.status_code}, body={resp.text}")
    except Exception as exc:
        print(f"[WhatsApp] Error sending message: {exc}")


@method_decorator(ensure_csrf_cookie, name='dispatch')
class GetCSRFToken(APIView):
    """
    API endpoint to get CSRF token
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        return Response({'detail': 'CSRF cookie set'})


class UserRegistrationView(APIView):
    """
    API endpoint for user registration
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Create profile based on user type
            if user.user_type == 'maid':
                # Get maid biodata from request
                profile_data = {
                    'user': user,
                    'full_name': request.data.get('full_name', ''),
                    'date_of_birth': request.data.get('date_of_birth'),
                    'location': request.data.get('location', ''),
                    'latitude': request.data.get('latitude'),
                    'longitude': request.data.get('longitude'),
                    'phone_number': request.data.get('phone_number', ''),
                    'email': request.data.get('email', '')  # Optional email from account
                }
                
                # Handle profile photo upload
                if 'profile_photo' in request.FILES:
                    profile_data['profile_photo'] = request.FILES['profile_photo']
                
                MaidProfile.objects.create(**profile_data)
            elif user.user_type == 'homeowner':
                # Get home details from request
                home_address = request.data.get('home_address', '')
                home_type = request.data.get('home_type', 'apartment')
                number_of_rooms = request.data.get('number_of_rooms', 1)
                
                HomeownerProfile.objects.create(
                    user=user,
                    home_address=home_address,
                    home_type=home_type,
                    number_of_rooms=number_of_rooms
                )
            # Log the user in so subsequent requests are authenticated immediately
            try:
                login(request, user, backend='accounts.backends.PhoneNumberBackend')
            except Exception:
                pass

            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SendLoginPinView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendLoginPinSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone_number = serializer.validated_data["phone_number"].strip()
        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            return Response({"error": "No account found with this phone number"}, status=status.HTTP_404_NOT_FOUND)

        LoginOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        code = f"{random.randint(0, 999999):06d}"
        LoginOTP.objects.create(user=user, code=code)

        message = f"Your MaidMatch login code is {code}. It will expire in 5 minutes."
        send_whatsapp_message(phone_number, message)

        return Response({"message": "Login code sent via WhatsApp"}, status=status.HTTP_200_OK)


class UserLoginView(APIView):
    """
    API endpoint for user login
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = VerifyLoginPinSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        phone_number = serializer.validated_data["phone_number"].strip()
        pin = serializer.validated_data["pin"]

        try:
            user = User.objects.get(phone_number=phone_number)
        except User.DoesNotExist:
            return Response({"error": "Invalid code or phone number"}, status=status.HTTP_401_UNAUTHORIZED)
        # Temporary static codes while WhatsApp API integration is being finalized.
        # For development convenience, allow any existing user to log in with one of the
        # fixed codes below. The existing OTP logic remains as a fallback.
        static_pins = {"1111", "2222", "3333", "4444"}

        if pin in static_pins:
            login(request, user, backend='accounts.backends.PhoneNumberBackend')
            return Response({
                "message": "Login successful",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        otp = (
            LoginOTP.objects.filter(user=user, code=pin, is_used=False)
            .order_by("-created_at")
            .first()
        )

        if otp is None:
            return Response({"error": "Invalid code or phone number"}, status=status.HTTP_401_UNAUTHORIZED)

        if timezone.now() - otp.created_at > timedelta(minutes=5):
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            return Response({"error": "Code has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        try:
            if user.user_type == 'homeowner' and hasattr(user, 'homeowner_profile'):
                if not user.homeowner_profile.is_active:
                    return Response({
                        'error': 'Your account is blocked. Please contact the MaidMatch team for support.'
                    }, status=status.HTTP_403_FORBIDDEN)
            if user.user_type == 'maid' and hasattr(user, 'maid_profile'):
                if not user.maid_profile.is_enabled:
                    return Response({
                        'error': 'Your account is blocked. Please contact the MaidMatch team for support.'
                    }, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            pass

        login(request, user, backend='accounts.backends.PhoneNumberBackend')
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class UserLogoutView(APIView):
    """
    API endpoint for user logout
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for User CRUD operations
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own profile unless they're admin
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get', 'patch', 'put'])
    def me(self, request):
        """
        Get or update current user's profile
        """
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        
        elif request.method in ['PATCH', 'PUT']:
            partial = request.method == 'PATCH'
            serializer = UserUpdateSerializer(request.user, data=request.data, partial=partial)
            if serializer.is_valid():
                serializer.save()
                return Response(UserSerializer(request.user).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """
        Change user password
        """
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({
                    'error': 'Old password is incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
