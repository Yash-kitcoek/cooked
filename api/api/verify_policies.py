from app.database import SessionLocal
from app.models import DepartmentPolicy
from app.pipeline.policies import ensure_default_policies

db = SessionLocal()
ensure_default_policies(db)
policies = db.query(DepartmentPolicy).all()
for p in policies:
    print(f"{p.name}: {p.sla_hours}h SLA")
