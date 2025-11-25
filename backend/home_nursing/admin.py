from django.contrib import admin
from .models import HomeNurse, NursingServiceCategory


@admin.register(NursingServiceCategory)
class NursingServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "group")
    list_filter = ("group",)
    search_fields = ("name",)


@admin.register(HomeNurse)
class HomeNurseAdmin(admin.ModelAdmin):
    list_display = ("user", "nursing_level", "years_of_experience", "emergency_availability")
    list_filter = ("nursing_level", "emergency_availability")
    search_fields = ("user__username", "user__full_name", "council_registration_number")
    filter_horizontal = ("services",)
    autocomplete_fields = ["user"]
