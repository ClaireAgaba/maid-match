"""URL configuration for backend project."""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from payments.views import PesapalPaymentCallbackView

# API Documentation
schema_view = get_schema_view(
    openapi.Info(
        title="MaidMatch API",
        default_version='v1',
        description="API documentation for MaidMatch application",
        terms_of_service="https://www.maidmatch.com/terms/",
        contact=openapi.Contact(email="support@maidmatch.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Pesapal callback (must be at root level to match the callback URL)
    path('pesapal/payment-complete/', PesapalPaymentCallbackView.as_view(), name='pesapal_callback'),
    
    # API endpoints
    path('api/accounts/', include('accounts.urls')),
    path('api/maid/', include('maid.urls')),
    path('api/homeowner/', include('homeowner.urls')),
    path('api/cleaning-company/', include('cleaning_company.urls')),
    path('api/home-nursing/', include('home_nursing.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/support/', include('admin_app.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
