import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import ProblemGroup, Priority, ComplaintStatus

# Disable postgres to localhost replacement when running inside container
db_url = settings.database_url

engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Target department based on the login account "hostel_staff"
dept = "Hostel"

demo_problems = [
    {
        "title": "No Water Supply in Block B Washrooms",
        "description": "Multiple students reporting no water in Block B washrooms since yesterday morning.",
        "priority": Priority.urgent.value,
        "complaint_count": 42,
        "affected_users": 128,
        "urgency_score": 95.0,
        "impact_score": 85.3,
        "priority_score": 92.1,
    },
    {
        "title": "Wi-Fi Router Dead on 3rd Floor",
        "description": "The internet router in the 3rd floor common room is completely unresponsive.",
        "priority": Priority.high.value,
        "complaint_count": 15,
        "affected_users": 60,
        "urgency_score": 70.0,
        "impact_score": 40.0,
        "priority_score": 65.5,
    },
    {
        "title": "Broken Window Screen in Room 204",
        "description": "The mosquito net on the window is torn and needs replacement.",
        "priority": Priority.low.value,
        "complaint_count": 1,
        "affected_users": 2,
        "urgency_score": 15.0,
        "impact_score": 1.3,
        "priority_score": 12.0,
    }
]

for p in demo_problems:
    # check if already exists
    if db.query(ProblemGroup).filter(ProblemGroup.title == p["title"]).first():
        continue
    
    group = ProblemGroup(
        id=uuid.uuid4(),
        problem_code=f"PROB-{uuid.uuid4().hex[:8].upper()}",
        title=p["title"],
        description=p["description"],
        department=dept,
        complaint_count=p["complaint_count"],
        affected_users=p["affected_users"],
        priority=p["priority"],
        status=ComplaintStatus.open.value,
        urgency_score=p["urgency_score"],
        impact_score=p["impact_score"],
        priority_score=p["priority_score"],
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(group)

db.commit()
print("Successfully seeded 3 demo problems for the Hostel department!")
db.close()
