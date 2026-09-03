"""
Database model namespace
"""

from .user import User, Role, StudentProfile
from .complaint import (
    Complaint,
    Attachment,
    ComplaintEmbedding,
    ComplaintRelation,
    ComplaintStatus,
    Priority,
)
from .communication import Message, Comment, Notification
from .audit import AuditLog, IdempotencyKey
from .department import DepartmentPolicy
from .problem_group import ProblemGroup

__all__ = [
    "User",
    "Role",
    "StudentProfile",
    "Complaint",
    "Attachment",
    "ComplaintEmbedding",
    "ComplaintRelation",
    "ComplaintStatus",
    "Priority",
    "Message",
    "Comment",
    "Notification",
    "AuditLog",
    "IdempotencyKey",
    "DepartmentPolicy",
    "ProblemGroup",
]