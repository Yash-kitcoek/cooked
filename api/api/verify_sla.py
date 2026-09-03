import os
from datetime import datetime, timezone
from uuid import uuid4

from app.database import SessionLocal
from app.models import Complaint, DepartmentPolicy, ProblemGroup
from app.pipeline.policies import ensure_default_policies
from app.pipeline.orchestrator import process_complaint

def verify_electrical():
    db = SessionLocal()
    # Create an electrical complaint with short circuit keywords
    # but initially uncategorized.
    c = Complaint(
        id=uuid4(),
        title="Electrical issue in block C",
        description="There is a huge spark and short circuit near the main board.",
        source="web",
        affected_users=1,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    
    print(f"Created complaint {c.id}")
    
    # Process it through the pipeline
    process_complaint(db, c.id)
    
    db.refresh(c)
    print(f"Complaint {c.id} department: {c.department}")
    print(f"Complaint {c.id} SLA hours from DB: {c.sla_due_at}")
    
    if c.problem_group_id:
        group = db.query(ProblemGroup).get(c.problem_group_id)
        print(f"Group SLA hours from DB: {group.sla_due_at}")
    
    # Calculate difference
    now = datetime.now(timezone.utc)
    if c.sla_due_at:
        # Since sla_due_at is naive but stored as UTC in DB, make now naive UTC
        naive_now = datetime.utcnow()
        delta = c.sla_due_at - naive_now
        hours = delta.total_seconds() / 3600
        print(f"SLA is approx {hours:.1f} hours from now (expected ~12.0 for Electrical)")

if __name__ == "__main__":
    verify_electrical()
