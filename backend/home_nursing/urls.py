from django.urls import path
from .views import (
    HomeNursingPingView,
    NursingServiceCategoryGroupedList,
    HomeNurseRegisterView,
    MyHomeNurseView,
    AdminHomeNurseListView,
    AdminHomeNurseActionsView,
    PublicNurseBrowseList,
)

app_name = "home_nursing"

urlpatterns = [
    path("ping/", HomeNursingPingView.as_view(), name="ping"),
    path("categories/grouped/", NursingServiceCategoryGroupedList.as_view(), name="categories_grouped"),
    path("register/", HomeNurseRegisterView.as_view(), name="register"),
    path("me/", MyHomeNurseView.as_view(), name="me"),
    path("admin/nurses/", AdminHomeNurseListView.as_view(), name="admin_nurses"),
    path("admin/nurses/<int:pk>/<str:action_name>/", AdminHomeNurseActionsView.as_view(), name="admin_nurse_action"),
    path("public/browse/", PublicNurseBrowseList.as_view(), name="public_browse"),
]
