from django.contrib import admin
from .models import HomeownerProfile, Job, JobApplication, Review

# Register your models here.

@admin.register(HomeownerProfile)
class HomeownerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'home_type', 'number_of_rooms', 'created_at')
    list_filter = ('home_type',)
    search_fields = ('user__username', 'user__email', 'home_address')
    readonly_fields = ('created_at', 'updated_at')


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
