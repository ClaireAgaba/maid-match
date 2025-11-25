from django.urls import path
from .views import (
    HomeNursingPingView,
    NursingServiceCategoryGroupedList,
    HomeNurseRegisterView,
    MyHomeNurseView,
)

app_name = "home_nursing"

urlpatterns = [
    path("ping/", HomeNursingPingView.as_view(), name="ping"),
    path("categories/grouped/", NursingServiceCategoryGroupedList.as_view(), name="categories_grouped"),
    path("register/", HomeNurseRegisterView.as_view(), name="register"),
    path("me/", MyHomeNurseView.as_view(), name="me"),
]
