from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import (
    UserSerializer, UserRegistrationSerializer, UserUpdateSerializer,
    ChangePasswordSerializer, LoginSerializer
)
from maid.models import MaidProfile
from homeowner.models import HomeownerProfile

User = get_user_model()


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
                login(request, user)
            except Exception:
                pass

            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """
    API endpoint for user login
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                # Block login if homeowner account is deactivated or maid account is disabled
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
                    # If any unexpected error occurs, continue to avoid masking login entirely
                    pass
                login(request, user)
                return Response({
                    'message': 'Login successful',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Invalid credentials'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
