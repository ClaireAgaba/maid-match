from django.contrib import admin
from .models import MaidProfile, MaidAvailability

# Register your models here.

@admin.register(MaidProfile)
class MaidProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone_number', 'location', 'experience_years', 'hourly_rate', 'availability_status', 'rating')
    list_filter = ('availability_status', 'experience_years', 'date_of_birth')
    search_fields = ('full_name', 'phone_number', 'email', 'location', 'skills', 'user__username')
    readonly_fields = ('created_at', 'updated_at', 'total_jobs_completed', 'rating')
    
    fieldsets = (
        ('Bio Data & General Info', {
            'fields': ('user', 'full_name', 'date_of_birth', 'profile_photo', 'phone_number', 'email')
        }),
        ('Location', {
            'fields': ('location', 'latitude', 'longitude')
        }),
        ('Professional Info', {
            'fields': ('bio', 'experience_years', 'hourly_rate', 'skills', 'availability_status')
        }),
        ('Performance', {
            'fields': ('rating', 'total_jobs_completed')
        }),
        ('Documents', {
            'fields': ('id_document', 'certificate')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(MaidAvailability)
class MaidAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('maid', 'day_of_week', 'start_time', 'end_time', 'is_available')
    list_filter = ('day_of_week', 'is_available')
    search_fields = ('maid__user__username',)
