import jwt
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import authentication, exceptions

User = get_user_model()


def generate_access_token(user):
    """Generate a simple JWT access token for the given user.

    Payload is intentionally small: just user_id and an expiry.
    """
    expires_at = timezone.now() + timedelta(days=7)
    payload = {
        "user_id": user.id,
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    # PyJWT>=2 returns a str, older versions return bytes
    if isinstance(token, bytes):
        token = token.decode("utf-8")
    return token


class SimpleJWTAuthentication(authentication.BaseAuthentication):
    """Very small JWT auth class using Authorization: Bearer <token>.

    This is stateless and works well with the SPA frontend hosted on a
    different domain (Netlify/custom domain) without relying on cookies.
    """

    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != self.keyword.lower():
            return None

        token = parts[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token has expired")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Invalid authentication token")

        user_id = payload.get("user_id")
        if not user_id:
            raise exceptions.AuthenticationFailed("Invalid token payload")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed("User not found")

        return user, None
