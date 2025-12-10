from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import SupportTicket, TicketMessage
from .serializers import (
    SupportTicketSerializer,
    SupportTicketCreateSerializer,
    TicketReplySerializer,
    TicketSatisfactionSerializer,
    TicketMessageSerializer,
)


class IsAdminOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_staff or getattr(user, "user_type", None) == "admin":
            return True
        return obj.created_by_id == user.id


class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all().select_related("created_by").prefetch_related("messages")
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwner]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.is_staff or getattr(user, "user_type", None) == "admin":
            return qs
        return qs.filter(created_by=user)

    def get_serializer_class(self):
        if self.action == "create":
            return SupportTicketCreateSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        ticket = serializer.save(created_by=self.request.user)
        # Initial message body is taken from request.data["body"]
        body = self.request.data.get("body", "").strip()
        if body:
            TicketMessage.objects.create(ticket=ticket, sender=self.request.user, body=body)

    @action(detail=True, methods=["get"], url_path="messages")
    def messages(self, request, pk=None):
        ticket = self.get_object()
        msgs = ticket.messages.select_related("sender").all()
        serializer = TicketMessageSerializer(msgs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="reply")
    def reply(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            body=serializer.validated_data["body"],
        )
        ticket.updated_at = timezone.now()
        ticket.save(update_fields=["updated_at"])
        return Response({"detail": "Reply added."}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="close")
    def close(self, request, pk=None):
        ticket = self.get_object()
        user = request.user
        # Only creator or admin can close
        if not (user.is_staff or getattr(user, "user_type", None) == "admin" or ticket.created_by_id == user.id):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        ticket.status = "closed"
        ticket.closed_at = timezone.now()
        ticket.save(update_fields=["status", "closed_at", "updated_at"])
        return Response({"detail": "Ticket closed."})

    @action(detail=True, methods=["post"], url_path="satisfaction")
    def satisfaction(self, request, pk=None):
        ticket = self.get_object()
        # Only ticket owner can submit satisfaction feedback
        if ticket.created_by_id != request.user.id:
            return Response({"detail": "Only the ticket owner can provide satisfaction feedback."}, status=status.HTTP_403_FORBIDDEN)
        serializer = TicketSatisfactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket.was_helped = serializer.validated_data["was_helped"]
        ticket.satisfaction_comment = serializer.validated_data.get("satisfaction_comment", "")
        ticket.save(update_fields=["was_helped", "satisfaction_comment", "updated_at"])
        return Response({"detail": "Thank you for your feedback."})
