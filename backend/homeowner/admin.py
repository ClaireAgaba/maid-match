from django.contrib import admin
from .models import HomeownerProfile, Job, JobApplication, Review

# Register your models here.

from django.utils.html import format_html

@admin.register(HomeownerProfile)
class HomeownerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'home_type', 'number_of_rooms', 'is_verified', 'is_active', 'created_at', 'verification_status')
    list_filter = ('home_type', 'is_verified', 'is_active', 'created_at')
    search_fields = ('user__username', 'user__email', 'home_address', 'user__first_name', 'user__last_name')
    readonly_fields = ('created_at', 'updated_at', 'verification_status')
    list_editable = ('is_verified', 'is_active')
    actions = ['verify_selected', 'unverify_selected', 'activate_selected', 'deactivate_selected']
    fieldsets = (
        ('Account Information', {
            'fields': ('user', 'is_verified', 'is_active', 'verification_status', 'verification_notes')
        }),
        ('Profile Information', {
            'fields': ('home_address', 'home_type', 'number_of_rooms', 'preferred_maid_gender')
        }),
        ('Documents', {
            'fields': ('id_document', 'lc_letter')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def verification_status(self, obj):
        if obj.is_verified:
            return format_html('<span style="color: green;">✓ Verified</span>')
        return format_html('<span style="color: red;">✗ Not Verified</span>')
    verification_status.short_description = 'Verification Status'

    def verify_selected(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f"Successfully verified {updated} homeowners.")
    verify_selected.short_description = "Mark selected homeowners as verified"

    def unverify_selected(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f"Successfully unverified {updated} homeowners.")
    unverify_selected.short_description = "Mark selected homeowners as unverified"

    def activate_selected(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Successfully activated {updated} homeowners.")
    activate_selected.short_description = "Activate selected homeowners"

    def deactivate_selected(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Successfully deactivated {updated} homeowners.")
    deactivate_selected.short_description = "Deactivate selected homeowners"


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'homeowner', 'status', 'job_date', 'hourly_rate', 'assigned_maid', 'created_at')
    list_filter = ('status', 'job_date')
    search_fields = ('title', 'homeowner__user__username', 'location')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'job_date'


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('job', 'maid', 'status', 'proposed_rate', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('job__title', 'maid__user__username')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('job', 'reviewer', 'reviewee', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('reviewer__username', 'reviewee__username', 'job__title')
    readonly_fields = ('created_at',)
