from django.urls import path
from .views import (
    CleaningCompanyPingView,
    ServiceCategoryGroupedList,
    CleaningCompanyRegisterView,
    MyCleaningCompanyView,
    CompanyGalleryListView,
    CompanyGalleryListCreateView,
    CompanyGalleryDetailView,
    AdminCompanyListView,
    AdminCompanyBulkUpdateView,
    PublicCompanyBrowseList,
    PublicCompanyGalleryListView,
)

app_name = "cleaning_company"

urlpatterns = [
    path("ping/", CleaningCompanyPingView.as_view(), name="ping"),
    path("categories/grouped/", ServiceCategoryGroupedList.as_view(), name="categories_grouped"),
    path("register/", CleaningCompanyRegisterView.as_view(), name="register"),
    path("me/", MyCleaningCompanyView.as_view(), name="me"),
    path("gallery/", CompanyGalleryListCreateView.as_view(), name="gallery_list_create"),
    path("gallery/<int:pk>/", CompanyGalleryDetailView.as_view(), name="gallery_detail"),
    path("browse/", PublicCompanyBrowseList.as_view(), name="browse"),
    path("public/<int:company_id>/gallery/", PublicCompanyGalleryListView.as_view(), name="public_gallery"),
    path("admin/companies/", AdminCompanyListView.as_view(), name="admin_company_list"),
    path("admin/companies/bulk/", AdminCompanyBulkUpdateView.as_view(), name="admin_company_bulk"),
]
