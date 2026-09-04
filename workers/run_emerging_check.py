"""Optional cron entrypoint: python workers/run_emerging_check.py

The worker container already ticks emerging cluster checks on its own interval
(``app.worker.emerging_loop``). Use this only when you would rather drive the check
from an external scheduler. Run it from the ``api`` directory so ``app`` imports.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "api" / "api"))

from app.tasks import enqueue_emerging_check

if __name__ == "__main__":
    enqueue_emerging_check()
