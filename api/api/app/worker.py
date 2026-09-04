import logging
import threading
import time

import redis
from rq import Worker

from app.config import settings
from app.logging_config import configure_logging
from app.workers.emerging_tasks import check_emerging_clusters
from app.workers.sla_tasks import check_slas


def sla_loop() -> None:
    # ponytail: single in-process ticker, no leader election. Running more than
    # one worker replica would double-send escalation mail; move to rq-scheduler
    # or a Kubernetes CronJob before scaling the worker past one instance.
    while True:
        try:
            escalated = check_slas()
            if escalated:
                logging.info("sla check escalated %s complaints", escalated)
        except Exception:
            logging.exception("sla check failed")
        time.sleep(settings.sla_check_interval_seconds)


def emerging_loop() -> None:
    while True:
        try:
            flagged = check_emerging_clusters()
            if flagged:
                logging.info("emerging cluster check flagged %s incidents", len(flagged))
        except Exception:
            logging.exception("emerging cluster check failed")
        time.sleep(settings.emerging_check_interval_seconds)


def main() -> None:
    configure_logging()
    logging.info("starting rq worker")
    threading.Thread(target=sla_loop, daemon=True).start()
    threading.Thread(target=emerging_loop, daemon=True).start()
    conn = redis.from_url(settings.redis_url)
    Worker(["complaints"], connection=conn).work()


if __name__ == "__main__":
    main()
