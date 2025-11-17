from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class User(AbstractUser):
    """
    Custom User model for MaidMatch application
    Extends Django's AbstractUser to support different user types
    Phone number is the primary identifier for local maids
    """
    USER_TYPE_CHOICES = (
        ('homeowner', 'Homeowner'),
        ('maid', 'Maid'),
        ('admin', 'Admin'),
    )
    
    # Override email to make it optional
    email = models.EmailField(blank=True, null=True)
    
    # Additional user fields
    full_name = models.CharField(max_length=200, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=(
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ), blank=True, null=True)
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)
    phone_number = models.CharField(max_length=15, unique=True, help_text="Primary contact number")
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"
