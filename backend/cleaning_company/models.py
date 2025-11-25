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
    display_photo = models.ImageField(upload_to="company_photos/", blank=True, null=True)
    verified = models.BooleanField(default=False)
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
