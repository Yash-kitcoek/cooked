from sqlalchemy.orm import Session

from app.models import DepartmentPolicy

DEFAULT_POLICIES = (
    ("Hostel", "Hostel", ["hostel", "water", "mess", "room", "warden", "leak", "leakage", "plumbing", "washroom", "bathroom"], 24),
    ("Exam Cell", "Examinations", ["exam", "result", "marks", "hallticket", "hall ticket", "timetable", "backlog"], 24),
    ("Canteen", "Canteen", ["canteen", "food", "meal", "lunch", "breakfast", "hygiene"], 24),
    ("Electrical", "Electrical", ["electrical", "power", "voltage", "spark", "short circuit", "wiring"], 12),
    ("CSE", "Academics", ["cse", "computer science"], 48),
    ("AIML", "Academics", ["aiml", "ai", "machine learning"], 48),
    ("CSBS", "Academics", ["csbs"], 48),
    ("Mechanical", "Academics", ["mechanical"], 48),
    ("ENTC", "Academics", ["entc", "electronics", "telecommunication"], 48),
    ("Biotech", "Academics", ["biotech", "biotechnology"], 48),
    ("General Review", "General", [], 72),
)


def ensure_default_policies(db: Session) -> None:
    existing_names = {row.name for row in db.query(DepartmentPolicy.name).all()}
    new_rows = [
        DepartmentPolicy(name=name, category=category, keywords=keywords, sla_hours=sla_hours)
        for name, category, keywords, sla_hours in DEFAULT_POLICIES
        if name not in existing_names
    ]
    if new_rows:
        db.add_all(new_rows)
        db.flush()
