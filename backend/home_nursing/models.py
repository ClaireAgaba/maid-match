from django.db import models
from django.conf import settings


class NursingServiceCategory(models.Model):
    """Taxonomy for nursing service offerings (Uganda-context groups)."""
    GROUP_ELDERLY = "elderly"
    GROUP_POST_SURGERY = "post_surgery"
    GROUP_SPECIAL_NEEDS = "special_needs"
    GROUP_BABY_INFANT = "baby_infant"
    GROUP_PALLIATIVE = "palliative"
    GROUP_HOME_MEDICAL = "home_medical"
    GROUP_CHOICES = (
        (GROUP_ELDERLY, "Elderly Care"),
        (GROUP_POST_SURGERY, "Post-Surgery Care"),
        (GROUP_SPECIAL_NEEDS, "Special Needs Care"),
        (GROUP_BABY_INFANT, "Baby & Infant Care"),
        (GROUP_PALLIATIVE, "Palliative Care (End-of-life)"),
        (GROUP_HOME_MEDICAL, "Home Medical Support"),
    )

    name = models.CharField(max_length=120, unique=True)
    group = models.CharField(max_length=20, choices=GROUP_CHOICES)

    class Meta:
        verbose_name = "Nursing Service Category"
        verbose_name_plural = "Nursing Service Categories"

    def __str__(self) -> str:
        return f"{self.name} ({self.get_group_display()})"


class HomeNurse(models.Model):
    """Profile for a nurse providing home nursing services."""
    LEVEL_ENROLLED = "enrolled"
    LEVEL_REGISTERED = "registered"
    LEVEL_MIDWIFE = "midwife"
    NURSING_LEVEL_CHOICES = (
        (LEVEL_ENROLLED, "Enrolled Nurse"),
        (LEVEL_REGISTERED, "Registered Nurse"),
        (LEVEL_MIDWIFE, "Midwife"),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="home_nurse")
    nursing_level = models.CharField(max_length=20, choices=NURSING_LEVEL_CHOICES)
    council_registration_number = models.CharField(max_length=100, blank=True, null=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    services = models.ManyToManyField(NursingServiceCategory, related_name="nurses", blank=True)
    display_photo = models.ImageField(upload_to="nurse/display/", blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    preferred_working_hours = models.CharField(max_length=120, blank=True, help_text="e.g., Weekdays 8am-5pm or Nights")
    emergency_availability = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "home_nurses"
        verbose_name = "Home Nurse"
        verbose_name_plural = "Home Nurses"

    def __str__(self) -> str:
        return f"{self.user.get_full_name() or self.user.username} - {self.get_nursing_level_display()}"
