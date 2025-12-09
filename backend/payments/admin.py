from django.contrib import admin
from .models import MobileMoneyTransaction


@admin.register(MobileMoneyTransaction)
class MobileMoneyTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "maid",
        "network",
        "phone_number",
        "amount",
        "status",
        "provider",
        "created_at",
        "completed_at",
    )
    list_filter = ("network", "status", "provider")
    search_fields = ("phone_number", "maid__user__username", "maid__full_name")
    readonly_fields = ("raw_callback", "created_at", "updated_at", "completed_at")
