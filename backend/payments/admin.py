from django.contrib import admin
from django.utils import timezone
from .models import MobileMoneyTransaction


@admin.register(MobileMoneyTransaction)
class MobileMoneyTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_user_display",
        "purpose",
        "network",
        "phone_number",
        "amount",
        "status",
        "provider",
        "created_at",
        "completed_at",
    )
    list_filter = ("network", "status", "provider", "purpose")
    search_fields = (
        "phone_number",
        "maid__user__username",
        "maid__full_name",
        "homeowner__user__username",
        "company__company_name",
        "home_nurse__user__username",
    )
    readonly_fields = ("raw_callback", "created_at", "updated_at", "completed_at")
    actions = ["apply_payment_effects_action"]

    def apply_payment_effects_action(self, request, queryset):
        """Admin action to manually apply payment effects for selected successful transactions"""
        count = 0
        for tx in queryset.filter(status=MobileMoneyTransaction.STATUS_SUCCESS):
            self._apply_payment_effects(tx)
            count += 1
        self.message_user(request, f"Applied payment effects for {count} transaction(s).")
    apply_payment_effects_action.short_description = "Apply payment effects (for successful transactions)"

    def get_user_display(self, obj):
        """Show which user this transaction belongs to"""
        if obj.maid:
            return f"Maid: {obj.maid.full_name}"
        elif obj.homeowner:
            return f"Homeowner: {obj.homeowner.user.username}"
        elif obj.company:
            return f"Company: {obj.company.company_name}"
        elif obj.home_nurse:
            return f"Nurse: {obj.home_nurse.user.username}"
        return "—"
    get_user_display.short_description = "User"

    def save_model(self, request, obj, form, change):
        """
        When admin manually changes status to SUCCESS, apply the same logic
        as the IPN webhook to update user subscriptions/onboarding flags.
        """
        old_status = None
        if change and obj.pk:
            try:
                old_status = MobileMoneyTransaction.objects.get(pk=obj.pk).status
            except MobileMoneyTransaction.DoesNotExist:
                pass

        super().save_model(request, obj, form, change)

        # If status just changed to SUCCESS, apply effects
        if (
            old_status != MobileMoneyTransaction.STATUS_SUCCESS
            and obj.status == MobileMoneyTransaction.STATUS_SUCCESS
        ):
            self._apply_payment_effects(obj)

    def _apply_payment_effects(self, tx):
        """Apply subscription/onboarding effects when payment succeeds"""
        from maid.models import MaidProfile
        from homeowner.models import HomeownerProfile
        from datetime import timedelta

        if not tx.completed_at:
            tx.completed_at = timezone.now()
            tx.save(update_fields=["completed_at"])

        if tx.purpose == MobileMoneyTransaction.PURPOSE_MAID_ONBOARDING and tx.maid_id:
            maid = tx.maid
            maid.onboarding_fee_paid = True
            maid.onboarding_fee_paid_at = timezone.now()
            maid.save(update_fields=["onboarding_fee_paid", "onboarding_fee_paid_at"])

        elif tx.purpose == MobileMoneyTransaction.PURPOSE_HOME_NURSE_ONBOARDING and tx.home_nurse_id:
            nurse = tx.home_nurse
            nurse.onboarding_fee_paid = True
            nurse.onboarding_fee_paid_at = timezone.now()
            nurse.save(update_fields=["onboarding_fee_paid", "onboarding_fee_paid_at"])

        elif tx.purpose == MobileMoneyTransaction.PURPOSE_HOMEOWNER_LIVE_IN and tx.homeowner_id:
            hp = tx.homeowner
            hp.has_live_in_credit = True
            hp.live_in_credit_awarded_at = timezone.now()
            hp.save(update_fields=["has_live_in_credit", "live_in_credit_awarded_at"])

        elif tx.purpose in {
            MobileMoneyTransaction.PURPOSE_HOMEOWNER_MONTHLY,
            MobileMoneyTransaction.PURPOSE_HOMEOWNER_DAY_PASS,
        } and tx.homeowner_id:
            hp = tx.homeowner
            now = timezone.now()
            if tx.purpose == MobileMoneyTransaction.PURPOSE_HOMEOWNER_MONTHLY:
                hp.subscription_type = HomeownerProfile.SUB_MONTHLY
                hp.subscription_expires_at = now + timedelta(days=30)
            else:
                hp.subscription_type = HomeownerProfile.SUB_DAY_PASS
                hp.subscription_expires_at = now + timedelta(days=1)
            hp.save(update_fields=["subscription_type", "subscription_expires_at"])

        elif tx.purpose in {
            MobileMoneyTransaction.PURPOSE_COMPANY_MONTHLY,
            MobileMoneyTransaction.PURPOSE_COMPANY_ANNUAL,
        } and tx.company_id:
            company = tx.company
            now = timezone.now()
            company.has_active_subscription = True
            if tx.purpose == MobileMoneyTransaction.PURPOSE_COMPANY_MONTHLY:
                company.subscription_type = "monthly"
                company.subscription_expires_at = now + timedelta(days=30)
            else:
                company.subscription_type = "annual"
                company.subscription_expires_at = now + timedelta(days=365)
            company.save(update_fields=["has_active_subscription", "subscription_type", "subscription_expires_at"])
