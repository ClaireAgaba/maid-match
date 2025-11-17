from django.db import models
from django.conf import settings

# Create your models here.

class HomeownerProfile(models.Model):
    """
    Extended profile for Homeowner users
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='homeowner_profile')
    home_address = models.TextField(blank=True, null=True)
    home_type = models.CharField(max_length=50, choices=(
        ('apartment', 'Apartment'),
        ('house', 'House'),
        ('villa', 'Villa'),
        ('condo', 'Condominium'),
    ), default='apartment')
    number_of_rooms = models.IntegerField(default=1)
    preferred_maid_gender = models.CharField(max_length=10, choices=(
        ('male', 'Male'),
        ('female', 'Female'),
        ('any', 'Any'),
    ), default='any', blank=True, null=True)
    
    # Documents
    id_document = models.FileField(upload_to='homeowner_documents/ids/', blank=True, null=True)
    lc_letter = models.FileField(upload_to='homeowner_documents/lc_letters/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'homeowner_profiles'
        verbose_name = 'Homeowner Profile'
        verbose_name_plural = 'Homeowner Profiles'
    
    def __str__(self):
        return f"Homeowner Profile - {self.user.username}"


class Job(models.Model):
    """
    Job postings created by homeowners
    """
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    homeowner = models.ForeignKey(HomeownerProfile, on_delete=models.CASCADE, related_name='jobs')
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.TextField()
    job_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_maid = models.ForeignKey('maid.MaidProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_jobs')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'jobs'
        verbose_name = 'Job'
        verbose_name_plural = 'Jobs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.homeowner.user.username}"


class JobApplication(models.Model):
    """
    Maids apply to jobs through this model
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    )
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    maid = models.ForeignKey('maid.MaidProfile', on_delete=models.CASCADE, related_name='job_applications')
    cover_letter = models.TextField(blank=True, null=True)
    proposed_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_applications'
        verbose_name = 'Job Application'
        verbose_name_plural = 'Job Applications'
        unique_together = ['job', 'maid']
    
    def __str__(self):
        return f"{self.maid.user.username} -> {self.job.title}"


class Review(models.Model):
    """
    Reviews for completed jobs
    """
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_given')
    reviewee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])  # 1-5 stars
    comment = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'reviews'
        verbose_name = 'Review'
        verbose_name_plural = 'Reviews'
    
    def __str__(self):
        return f"Review by {self.reviewer.username} for {self.reviewee.username}"
