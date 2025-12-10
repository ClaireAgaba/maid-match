from django.db import models
from django.conf import settings


class ServiceCategory(models.Model):
    """Taxonomy for cleaning service types (e.g., Deep Cleaning, Move-out)."""
    GROUP_HOUSE = "house"
    GROUP_EXTERNAL = "external"
    GROUP_FUMIGATION = "fumigation"
    GROUP_COMMERCIAL = "commercial"
    GROUP_LAUNDRY = "laundry"
    GROUP_CHOICES = (
        (GROUP_HOUSE, "House Cleaning Services"),
        (GROUP_EXTERNAL, "External / Compound Services"),
        (GROUP_FUMIGATION, "Fumigation / Pest Control"),
        (GROUP_COMMERCIAL, "Commercial / Office Cleaning"),
        (GROUP_LAUNDRY, "Laundry Services"),
    )

    name = models.CharField(max_length=100, unique=True)
    group = models.CharField(max_length=20, choices=GROUP_CHOICES)

    class Meta:
        verbose_name = "Service Category"
        verbose_name_plural = "Service Categories"

    def __str__(self) -> str:
        return f"{self.name} ({self.get_group_display()})"


class CleaningCompany(models.Model):
    """Profile for a company offering cleaning services."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cleaning_company")
    company_name = models.CharField(max_length=200)
    services = models.ManyToManyField(ServiceCategory, related_name="companies", blank=True)
    location = models.CharField(max_length=255)
    # Optional base GPS coordinates for company HQ/primary service area
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    # Live GPS location used for real-time matching (updated from dashboards)
    current_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    current_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    display_photo = models.ImageField(upload_to="company_photos/", blank=True, null=True)
    id_document = models.FileField(
        upload_to="company_documents/",
        blank=True,
        null=True,
        help_text="Business registration certificate or owner ID document",
    )
    verified = models.BooleanField(default=False)
    is_paused = models.BooleanField(
        default=False,
        help_text="If true, company is taking a break and will not see/receive jobs.",
    )
    service_pricing = models.TextField(blank=True, null=True, help_text="Per-service starting pay in free text (one per line)")
    # Subscription / payment status for access to homeowner job requests
    has_active_subscription = models.BooleanField(default=False)
    subscription_type = models.CharField(
        max_length=20,
        choices=(
            ("monthly", "Monthly"),
            ("annual", "Annual"),
        ),
        blank=True,
        null=True,
    )
    subscription_expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "cleaning_companies"
        verbose_name = "Cleaning Company"
        verbose_name_plural = "Cleaning Companies"

    def __str__(self) -> str:
        return self.company_name


class CleaningWorkImage(models.Model):
    """Gallery item for a company's previous work (read-only used for dashboard listing)."""
    company = models.ForeignKey(CleaningCompany, on_delete=models.CASCADE, related_name="gallery")
    image = models.ImageField(upload_to="cleaning_gallery/")
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Cleaning Work Image"
        verbose_name_plural = "Cleaning Work Gallery"

    def __str__(self) -> str:
        return f"{self.company.company_name} - {self.caption or self.image.name}"
