from django.db import models
from django.conf import settings

# Create your models here.

class MaidServiceCategory(models.Model):
    """Taxonomy for maid / domestic service offerings."""
    GROUP_DOMESTIC = "domestic_housekeeping"
    GROUP_NANNY = "nanny_childcare"
    GROUP_ELDERLY = "elderly_support"
    GROUP_RESIDENTIAL = "residential_cleaning"
    GROUP_LIVE_IN = "live_in_maid"
    GROUP_LIVE_OUT = "live_out_maid"
    GROUP_COOKING = "cooking_meals"
    GROUP_LAUNDRY = "laundry_ironing"
    GROUP_PLACEMENT = "placement_recruitment"
    GROUP_ASSISTANT = "home_assistant"
    GROUP_AFTER_PARTY = "after_party_cleaning"
    GROUP_EVENT_HELPERS = "event_helpers"

    GROUP_CHOICES = (
        (GROUP_DOMESTIC, "Domestic Housekeeping Services"),
        (GROUP_NANNY, "Nanny / Childcare Services"),
        (GROUP_ELDERLY, "Home Care & Elderly Support"),
        (GROUP_RESIDENTIAL, "Residential Cleaning Services"),
        (GROUP_LIVE_IN, "Live-in Maid Services"),
        (GROUP_LIVE_OUT, "Live-out Maid Services"),
        (GROUP_COOKING, "Cooking & Meal Preparation"),
        (GROUP_LAUNDRY, "Laundry & Ironing Services"),
        (GROUP_PLACEMENT, "Domestic Staff Placement / Recruitment"),
        (GROUP_ASSISTANT, "Home Assistant Services"),
        (GROUP_AFTER_PARTY, "After-Party & Event Cleaning Services"),
        (GROUP_EVENT_HELPERS, "Cooking, Serving & Event Helpers"),
    )

    name = models.CharField(max_length=120, unique=True)
    group = models.CharField(max_length=40, choices=GROUP_CHOICES)

    class Meta:
        verbose_name = "Maid Service Category"
        verbose_name_plural = "Maid Service Categories"

    def __str__(self) -> str:
        return f"{self.name} ({self.get_group_display()})"


class MaidProfile(models.Model):
    """
    Extended profile for Maid users with comprehensive biodata
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='maid_profile')
    
    # Bio Data & General Info
    full_name = models.CharField(max_length=200, blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    profile_photo = models.ImageField(upload_to='maid_profiles/photos/', blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, default='', help_text="Home/base location (manual or approximate)")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Home/base latitude")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True, help_text="Home/base longitude")
    # Live GPS location used for real-time matching (updated from dashboards)
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True, default='')
    email = models.EmailField(blank=True, null=True, help_text="Optional email")
    
    # Professional Info
    bio = models.TextField(blank=True, null=True)
    experience_years = models.IntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    CATEGORY_CHOICES = (
        ('temporary', 'Temporary'),              # come work and go
        ('live_in', 'Live-in'),                  # moves in with the homeowner
        ('placement', 'Domestic Staff Placement')
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, null=True, blank=True)
    skills = models.TextField(help_text="Comma-separated skills", blank=True, null=True)
    service_pricing = models.TextField(blank=True, null=True, help_text="Per-service starting pay in free text (one per line)")
    availability_status = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_jobs_completed = models.IntegerField(default=0)
    
    # Account Status (Admin controlled)
    is_verified = models.BooleanField(default=False, help_text="Account verified by admin")
    is_enabled = models.BooleanField(default=True, help_text="Account enabled/disabled by admin")
    verification_notes = models.TextField(blank=True, null=True, help_text="Admin notes on verification")

    # Onboarding payment
    onboarding_fee_paid = models.BooleanField(default=False, help_text="Whether the maid has paid the onboarding fee")
    onboarding_fee_paid_at = models.DateTimeField(null=True, blank=True, help_text="When the onboarding fee was recorded as paid")
    
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
