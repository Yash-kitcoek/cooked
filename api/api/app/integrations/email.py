"""SMTP integration facade."""

from app.workers.notifications import deliver

__all__ = ["deliver"]
