from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import User, Role
from app.security import hash_password

db_url = settings.database_url

engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

admin = db.query(User).filter(
    (func.lower(User.username) == "admin") | (func.lower(User.email) == "admin@gmail.com")
).first()

if not admin:
    admin = User(
        email="admin@gmail.com",
        username="admin",
        hashed_password=hash_password("admin@123"),
        role=Role.admin.value,
        department=None
    )
    db.add(admin)
    print("Created Admin user: username='admin', password='admin@123'")
else:
    admin.username = "admin"
    admin.email = "admin@gmail.com"
    admin.hashed_password = hash_password("admin@123")
    admin.role = Role.admin.value
    print("Updated Admin user: username='admin', password='admin@123'")

db.commit()
db.close()
