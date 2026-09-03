import os
from app.config import settings
from app.models import User, AuditLog

# Automatically swap Docker container hostname 'postgres' to 'localhost' when running on Windows host
if "@postgres:" in settings.database_url:
    local_db_url = settings.database_url.replace("@postgres:", "@localhost:")
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    engine = create_engine(local_db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
else:
    from app.database import get_db
    db = next(get_db())

print("=" * 60)
print("               REGISTERED USERS")
print("=" * 60)
users = db.query(User).order_by(User.created_at.desc()).all()
if not users:
    print("No users found.")
for u in users:
    print(f"ID: {u.id:<4} | Username: {str(u.username):<15} | Email: {u.email:<25} | Role: {u.role:<10} | Created: {u.created_at}")

print("\n" + "=" * 60)
print("               SIGN-IN & AUDIT LOGS")
print("=" * 60)
logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()
if not logs:
    print("No audit logs found.")
for log in logs:
    email = log.event_metadata.get("email", f"User #{log.actor_id or log.entity_id}")
    print(f"ID: {log.id:<4} | Action: {log.action:<20} | User: {email:<25} | Time: {log.created_at}")
print("=" * 60)
