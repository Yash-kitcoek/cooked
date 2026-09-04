"""Optional cron entrypoint: python workers/run_sla_check.py

The worker container already ticks SLA checks on its own interval
(``app.worker.sla_loop``). Use this only when you would rather drive the check
from an external scheduler. Run it from the ``api`` directory so ``app`` imports.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api" / "api"))

from app.tasks import enqueue_sla_check

if __name__ == "__main__":
    enqueue_sla_check()
