from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Complaint, SuggestionReview

CLUSTER_THRESHOLD = 3

def recurring_clusters(db: Session) -> list[tuple]:
    rows = (
        db.query(Complaint.department, Complaint.category, Complaint.subcategory, func.count(Complaint.id))
        .filter(Complaint.deleted_at.is_(None))
        .group_by(Complaint.department, Complaint.category, Complaint.subcategory)
        .having(func.count(Complaint.id) >= CLUSTER_THRESHOLD)
        .all()
    )
    reviewed = {r.cluster_key for r in db.query(SuggestionReview).all()}
    return [r for r in rows if f"{r[0]}|{r[1]}|{r[2]}" not in reviewed]
