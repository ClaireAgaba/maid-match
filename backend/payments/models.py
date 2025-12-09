from django.db import models
from django.conf import settings
from maid.models import MaidProfile
from homeowner.models import HomeownerProfile


class MobileMoneyTransaction(models.Model):
    NETWORK_MTN = "mtn"
    NETWORK_AIRTEL = "airtel"

    NETWORK_CHOICES = (
        (NETWORK_MTN, "MTN Mobile Money"),
        (NETWORK_AIRTEL, "Airtel Money"),
    )

    STATUS_PENDING = "pending"
    STATUS_SUCCESS = "successful"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_SUCCESS, "Successful"),
        (STATUS_FAILED, "Failed"),
    )

    # Purpose / plan type (so we can reuse this table for maids and homeowners)
    PURPOSE_MAID_ONBOARDING = "maid_onboarding"
    PURPOSE_HOMEOWNER_LIVE_IN = "homeowner_live_in"
    PURPOSE_HOMEOWNER_MONTHLY = "homeowner_monthly"
    PURPOSE_HOMEOWNER_DAY_PASS = "homeowner_day_pass"

    PURPOSE_CHOICES = (
        (PURPOSE_MAID_ONBOARDING, "Maid onboarding fee"),
        (PURPOSE_HOMEOWNER_LIVE_IN, "Homeowner live-in placement fee"),
        (PURPOSE_HOMEOWNER_MONTHLY, "Homeowner monthly subscription"),
        (PURPOSE_HOMEOWNER_DAY_PASS, "Homeowner 24h access pass"),
    )

    maid = models.ForeignKey(MaidProfile, on_delete=models.CASCADE, related_name="payments", null=True, blank=True)
    homeowner = models.ForeignKey(HomeownerProfile, on_delete=models.CASCADE, related_name="payments", null=True, blank=True)
    network = models.CharField(max_length=10, choices=NETWORK_CHOICES)
    phone_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES, default=PURPOSE_MAID_ONBOARDING)
    provider = models.CharField(max_length=50, default="pesapal")
    provider_reference = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    raw_callback = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        target = self.maid or self.homeowner
        return f"MOMO {self.id} - {self.network} {self.amount} {self.status} ({self.purpose}) for {target}"
