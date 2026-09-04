from rq import Queue
import redis

from app.config import settings


def get_queue() -> Queue:
    conn = redis.from_url(settings.redis_url)
    return Queue("complaints", connection=conn)


def enqueue_ai_processing(complaint_id: str) -> None:
    try:
        get_queue().enqueue("app.workers.ai_tasks.process_ai", complaint_id, job_timeout=120)
    except Exception:
        pass


def enqueue_sla_check() -> None:
    get_queue().enqueue("app.workers.sla_tasks.check_slas", job_timeout=120)


def enqueue_emerging_check() -> None:
    get_queue().enqueue("app.workers.emerging_tasks.check_emerging_clusters", job_timeout=120)

