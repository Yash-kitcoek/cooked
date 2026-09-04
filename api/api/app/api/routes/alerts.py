from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models import ComplaintStatus, ProblemGroup, Role, User
from app.rbac import require_role
from app.schemas import EmergingAlertOut
from app.workers.emerging_tasks import calculate_cluster_velocity

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/emerging", response_model=list[EmergingAlertOut])
def get_emerging_alerts(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[EmergingAlertOut]:
    """Retrieve currently flagged emerging incident clusters for staff and admins."""
    require_role(current, Role.staff, Role.department_head, Role.admin)

    department = None if current.role == Role.admin.value else current.department

    query = (
        db.query(ProblemGroup)
        .options(joinedload(ProblemGroup.complaints))
        .filter(
            ProblemGroup.is_emerging.is_(True),
            ProblemGroup.status.in_([
                ComplaintStatus.open.value,
                ComplaintStatus.in_progress.value,
                ComplaintStatus.escalated.value,
            ]),
        )
    )
    if department is not None:
        query = query.filter(ProblemGroup.department == department)

    groups = query.order_by(
        ProblemGroup.emerging_flagged_at.desc(),
        ProblemGroup.created_at.desc(),
    ).all()

    now = datetime.now(timezone.utc)
    alerts: list[EmergingAlertOut] = []
    for group in groups:
        complaints = [c for c in group.complaints if c.deleted_at is None]
        complaint_count = len(complaints) if complaints else group.complaint_count
        first_time = group.earliest_complaint_time
        velocity = calculate_cluster_velocity(complaint_count, first_time, now)

        alerts.append(
            EmergingAlertOut(
                id=str(group.id),
                problem_code=group.problem_code,
                title=group.title,
                department=group.department,
                category=group.category or "General",
                location=group.location,
                complaint_count=complaint_count,
                velocity=velocity,
                first_complaint_time=first_time,
                latest_complaint_time=group.latest_complaint_time,
                emerging_flagged_at=group.emerging_flagged_at,
            )
        )

    return alerts
