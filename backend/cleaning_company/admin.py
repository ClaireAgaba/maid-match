from django.contrib import admin
from .models import CleaningCompany, ServiceCategory


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "group")
    list_filter = ("group",)
    search_fields = ("name",)


@admin.register(CleaningCompany)
class CleaningCompanyAdmin(admin.ModelAdmin):
    list_display = ("company_name", "user", "location", "verified")
    list_filter = ("verified",)
    search_fields = ("company_name", "user__username", "location")
    filter_horizontal = ("services",)
    autocomplete_fields = ["user"]

    # If you want to restrict to certain user types in admin selection, uncomment:
    # def formfield_for_foreignkey(self, db_field, request, **kwargs):
    #     from accounts.models import User
    #     if db_field.name == "user":
    #         kwargs["queryset"] = User.objects.all()
    #     return super().formfield_for_foreignkey(db_field, request, **kwargs)
