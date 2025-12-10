from django.urls import path
from .views import MaidOnboardingInitiateView, HomeNurseOnboardingInitiateView, HomeownerPaymentInitiateView, CleaningCompanyPaymentInitiateView, PesapalIPNView

urlpatterns = [
    path("maid-onboarding/initiate/", MaidOnboardingInitiateView.as_view(), name="maid_onboarding_initiate"),
    path("home-nurse-onboarding/initiate/", HomeNurseOnboardingInitiateView.as_view(), name="home_nurse_onboarding_initiate"),
    path("homeowner/initiate/", HomeownerPaymentInitiateView.as_view(), name="homeowner_payment_initiate"),
    path("cleaning-company/initiate/", CleaningCompanyPaymentInitiateView.as_view(), name="company_payment_initiate"),
    path("pesapal/ipn/", PesapalIPNView.as_view(), name="pesapal_ipn"),
]
