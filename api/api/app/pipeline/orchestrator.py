from sqlalchemy.orm import Session

from app.models import Complaint
from app.pipeline.classifier import classify_complaint
from app.pipeline.duplicate_detector import detect_duplicates
from app.pipeline.policies import ensure_default_policies
from app.pipeline.priority import apply_priority


def analyze_complaint(db: Session, complaint: Complaint) -> None:
    """Run the synchronous complaint analysis stages before persistence.

    Always re-derives SLA from department policies so that department-specific
    deadlines (e.g., Electrical=12h, Hostel=24h, General Review=72h) are
    applied correctly instead of always using the 48h column default.
    """
    ensure_default_policies(db)
    text = f"{complaint.title} {complaint.description}"
    if not complaint.category:
        text_tokens = classify_complaint(db, complaint)
        apply_priority(complaint, text_tokens)

    # Always apply department-specific SLA — the column default (48h) is only
    # a fallback for DB integrity; the pipeline owns the authoritative value.
    from app.models import DepartmentPolicy, utcnow
    from datetime import timedelta
    policy = db.query(DepartmentPolicy).filter_by(name=complaint.department).first()
    sla_hours = policy.sla_hours if policy else 48
    complaint.sla_due_at = utcnow() + timedelta(hours=sla_hours)

    detect_duplicates(db, complaint, text)
