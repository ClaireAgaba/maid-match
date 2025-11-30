from django.urls import path
from .views import (
    HomeNursingPingView,
    NursingServiceCategoryGroupedList,
    HomeNurseRegisterView,
    MyHomeNurseView,
    MyHomeNurseLocationView,
    AdminHomeNurseListView,
    AdminHomeNurseActionsView,
    PublicNurseBrowseList,
)

app_name = "home_nursing"

urlpatterns = [
    path('ping/', HomeNursingPingView.as_view(), name='home-nursing-ping'),
    path('categories/grouped/', NursingServiceCategoryGroupedList.as_view(), name='nursing-categories-grouped'),
    path('register/', HomeNurseRegisterView.as_view(), name='home-nurse-register'),
    path('me/', MyHomeNurseView.as_view(), name='home-nurse-me'),
    path('me/update-location/', MyHomeNurseLocationView.as_view(), name='home-nurse-location'),
    path('admin/nurses/', AdminHomeNurseListView.as_view(), name='admin-home-nurse-list'),
    path("admin/nurses/<int:pk>/<str:action_name>/", AdminHomeNurseActionsView.as_view(), name="admin_nurse_action"),
    path("public/browse/", PublicNurseBrowseList.as_view(), name="public_browse"),
]
