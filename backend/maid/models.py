from django.db import models
from django.conf import settings

# Create your models here.

class MaidProfile(models.Model):
    """
    Extended profile for Maid users with comprehensive biodata
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='maid_profile')
    
    # Bio Data & General Info
    full_name = models.CharField(max_length=200, blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    profile_photo = models.ImageField(upload_to='maid_profiles/photos/', blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, default='', help_text="Current location (auto-detected or manual)")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True, default='')
    email = models.EmailField(blank=True, null=True, help_text="Optional email")
    
    # Professional Info
    bio = models.TextField(blank=True, null=True)
    experience_years = models.IntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    skills = models.TextField(help_text="Comma-separated skills", blank=True, null=True)
    availability_status = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_jobs_completed = models.IntegerField(default=0)
    
    # Account Status (Admin controlled)
    is_verified = models.BooleanField(default=False, help_text="Account verified by admin")
    is_enabled = models.BooleanField(default=True, help_text="Account enabled/disabled by admin")
    verification_notes = models.TextField(blank=True, null=True, help_text="Admin notes on verification")
    
    # Documents
    id_document = models.FileField(upload_to='maid_documents/ids/', blank=True, null=True)
    certificate = models.FileField(upload_to='maid_documents/certificates/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'maid_profiles'
        verbose_name = 'Maid Profile'
        verbose_name_plural = 'Maid Profiles'
    
    def __str__(self):
        return f"Maid Profile - {self.user.username}"


class MaidAvailability(models.Model):
    """
    Tracks maid availability schedule
    """
    DAYS_OF_WEEK = (
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    )
    
    maid = models.ForeignKey(MaidProfile, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'maid_availability'
        verbose_name = 'Maid Availability'
        verbose_name_plural = 'Maid Availabilities'
        unique_together = ['maid', 'day_of_week']
    
    def __str__(self):
        return f"{self.maid.user.username} - {self.day_of_week}"
