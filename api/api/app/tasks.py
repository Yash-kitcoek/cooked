"""Backward-compatible task imports.

New code should import from ``app.workers`` directly.
"""

from app.workers.ai_tasks import process_ai
from app.workers.emerging_tasks import check_emerging_clusters
from app.workers.notifications import deliver
from app.workers.queue import enqueue_ai_processing, enqueue_emerging_check, enqueue_sla_check, get_queue
from app.workers.sla_tasks import check_slas

__all__ = [
    "check_emerging_clusters",
    "check_slas",
    "deliver",
    "enqueue_ai_processing",
    "enqueue_emerging_check",
    "enqueue_sla_check",
    "get_queue",
    "process_ai",
]
