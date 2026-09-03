from datetime import timedelta

from sqlalchemy.orm import Session

from app.models import Complaint, DepartmentPolicy, utcnow


def tokens(text: str) -> set[str]:
    import re

    return {word for word in re.findall(r"[a-z0-9]+", text.lower()) if len(word) > 2}


def classify_complaint(db: Session, complaint: Complaint) -> set[str]:
    text_tokens = tokens(f"{complaint.title} {complaint.description}")
    policies = db.query(DepartmentPolicy).filter_by(active=True).all()
    ranked = sorted(
        [
            (
                sum(keyword.lower() in text_tokens for keyword in policy.keywords),
                policy,
            )
            for policy in policies
        ],
        key=lambda item: item[0],
        reverse=True,
    )
    matches, policy = ranked[0] if ranked else (0, None)

    if policy and matches:
        if not complaint.department or complaint.department == "General Review":
            complaint.department = policy.name
        complaint.category = policy.category
        complaint.classification_confidence = round(min(0.95, 0.45 + matches * 0.2), 2)
        complaint.sla_due_at = utcnow() + timedelta(hours=policy.sla_hours)
    else:
        if not complaint.department:
            complaint.department = "General Review"
        complaint.category = "General"
        complaint.classification_confidence = 0.25

    return text_tokens
