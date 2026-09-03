"""Notification worker entrypoints."""

from app.workers.notifications import deliver

__all__ = ["deliver"]
