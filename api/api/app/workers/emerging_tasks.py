import logging
from datetime import datetime, timezone

from app.config import settings
from app.models import Complaint, ComplaintStatus, ProblemGroup


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def calculate_cluster_velocity(
    complaint_count: int,
    first_complaint_time: datetime | None,
    now: datetime | None = None,
) -> float:
    """Calculate complaint velocity (complaints/hour) since first complaint."""
    if complaint_count <= 0 or first_complaint_time is None:
        return 0.0
    first_utc = _ensure_utc(first_complaint_time)
    now_utc = _ensure_utc(now) or datetime.now(timezone.utc)

    elapsed_seconds = (now_utc - first_utc).total_seconds()
    # Guard against negative or near-zero elapsed time: minimum 1 minute (1/60 hr)
    hours = max(elapsed_seconds / 3600.0, 1.0 / 60.0)
    return round(complaint_count / hours, 2)


def check_emerging_clusters(db=None) -> list[ProblemGroup]:
    """Scan active problem groups, calculate velocity, and flag emerging clusters."""
    from app.workers.ai_tasks import _session

    owns_session = db is None
    db = db or _session()
    flagged: list[ProblemGroup] = []
    try:
        now = datetime.now(timezone.utc)
        active_statuses = [
            ComplaintStatus.open.value,
            ComplaintStatus.in_progress.value,
            ComplaintStatus.escalated.value,
        ]

        # Fetch all active clusters
        clusters = (
            db.query(ProblemGroup)
            .filter(ProblemGroup.status.in_(active_statuses))
            .all()
        )

        for cluster in clusters:
            active_complaints = (
                db.query(Complaint)
                .filter(
                    Complaint.problem_group_id == cluster.id,
                    Complaint.deleted_at.is_(None),
                )
                .all()
            )

            complaint_count = len(active_complaints) if active_complaints else cluster.complaint_count
            if active_complaints:
                times = [_ensure_utc(c.created_at) for c in active_complaints if c.created_at is not None]
                first_time = min(times) if times else _ensure_utc(cluster.created_at)
            else:
                first_time = _ensure_utc(cluster.created_at)

            velocity = calculate_cluster_velocity(complaint_count, first_time, now)

            # Check threshold
            is_threshold_crossed = (
                velocity >= settings.emerging_velocity_threshold
                and complaint_count >= settings.emerging_min_complaints
            )

            if is_threshold_crossed:
                if not cluster.is_emerging:
                    cluster.is_emerging = True
                    cluster.emerging_flagged_at = now
                    logging.info(
                        "Flagged emerging cluster %s (%s): count=%d, velocity=%.2f/hr",
                        cluster.id,
                        cluster.title,
                        complaint_count,
                        velocity,
                    )
                flagged.append(cluster)
            elif cluster.is_emerging:
                # Already flagged previously and still active
                flagged.append(cluster)

        # Clear flag on resolved/closed clusters
        resolved_clusters = (
            db.query(ProblemGroup)
            .filter(
                ProblemGroup.status.in_([ComplaintStatus.resolved.value, ComplaintStatus.closed.value]),
                ProblemGroup.is_emerging.is_(True),
            )
            .all()
        )
        for rc in resolved_clusters:
            rc.is_emerging = False

        db.commit()
        return flagged
    finally:
        if owns_session:
            db.close()
