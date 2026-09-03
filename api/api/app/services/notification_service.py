"""Notification business-service boundary."""

from app.workers.notifications import deliver

__all__ = ["deliver"]
