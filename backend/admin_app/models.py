from django.db import models
from django.conf import settings


class SupportTicket(models.Model):
    TOPIC_CHOICES = (
        ("general", "General question"),
        ("technical", "Technical issue / bug"),
        ("payments", "Payments & plans"),
        ("safety", "Safety or abuse report"),
        ("suggestion", "Feature suggestion"),
    )

    STATUS_CHOICES = (
        ("open", "Open"),
        ("closed", "Closed"),
    )

    topic = models.CharField(max_length=32, choices=TOPIC_CHOICES, default="general")
    subject = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="open")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_tickets",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    # Simple satisfaction feedback after closure
    was_helped = models.BooleanField(null=True, blank=True)
    satisfaction_comment = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:  # pragma: no cover - simple repr
        return f"Ticket #{self.id} ({self.topic}) by {self.created_by_id}"


class TicketMessage(models.Model):
    ticket = models.ForeignKey(
        SupportTicket,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_messages",
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:  # pragma: no cover
        return f"Message {self.id} on ticket {self.ticket_id}"
