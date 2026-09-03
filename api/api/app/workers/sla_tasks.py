import logging
from datetime import datetime, timezone

from app.models import Complaint, ComplaintStatus, Notification
from app.workers.notifications import deliver


def check_slas(db=None) -> int:
    from app.workers.ai_tasks import _session

    owns_session = db is None
    db = db or _session()
    escalated = 0
    try:
        now = datetime.now(timezone.utc)
        complaints = (
            db.query(Complaint)
            .filter(Complaint.sla_due_at <= now)
            .filter(Complaint.status.in_([ComplaintStatus.open.value, ComplaintStatus.in_progress.value]))
            .all()
        )
        pending = []
        for complaint in complaints:
            complaint.status = ComplaintStatus.escalated.value
            notification = Notification(
                complaint_id=complaint.id,
                channel="email",
                recipient=f"{complaint.department.lower()}-head@example.edu",
                subject=f"SLA escalated: {complaint.title}",
                body=f"Complaint {complaint.id} breached SLA and needs action.",
            )
            db.add(notification)
            pending.append(notification)
            escalated += 1
        db.commit()
        for notification in pending:
            try:
                if deliver(notification):
                    notification.sent_at = datetime.now(timezone.utc)
            except Exception:
                logging.exception("failed to deliver notification %s", notification.id)
        db.commit()
        return escalated
    finally:
        if owns_session:
            db.close()
