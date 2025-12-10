from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SupportTicket, TicketMessage

User = get_user_model()


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.username", read_only=True)
    sender_type = serializers.CharField(source="sender.user_type", read_only=True)

    class Meta:
        model = TicketMessage
        fields = [
            "id",
            "ticket",
            "sender",
            "sender_name",
            "sender_type",
            "body",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "created_at", "ticket"]


class SupportTicketSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    created_by_type = serializers.CharField(source="created_by.user_type", read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = [
            "id",
            "topic",
            "subject",
            "status",
            "created_by",
            "created_by_name",
            "created_by_type",
            "created_at",
            "updated_at",
            "closed_at",
            "was_helped",
            "satisfaction_comment",
            "messages",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_by_name",
            "created_by_type",
            "created_at",
            "updated_at",
            "closed_at",
            "messages",
        ]


class SupportTicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ["topic", "subject"]


class TicketReplySerializer(serializers.Serializer):
    body = serializers.CharField()


class TicketSatisfactionSerializer(serializers.Serializer):
    was_helped = serializers.BooleanField()
    satisfaction_comment = serializers.CharField(allow_blank=True, required=False)
