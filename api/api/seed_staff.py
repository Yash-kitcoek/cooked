from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models import User, Role
from app.security import hash_password

db_url = settings.database_url
# Do not replace postgres with localhost if running inside docker

engine = create_engine(db_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

staff_accounts = [
    ("hostel_staff", "hostel@institution.edu", "Hostel"),
    ("cse_staff", "cse@institution.edu", "CSE"),
    ("aiml_staff", "aiml@institution.edu", "AIML"),
    ("csbs_staff", "csbs@institution.edu", "CSBS"),
    ("mech_staff", "mech@institution.edu", "Mechanical"),
    ("elec_staff", "elec@institution.edu", "Electrical"),
    ("entc_staff", "entc@institution.edu", "ENTC"),
    ("biotech_staff", "biotech@institution.edu", "Biotech"),
    ("exam_staff", "exam@institution.edu", "Exam Cell"),
    ("canteen_staff", "canteen@institution.edu", "Canteen"),
]

for username, email, dept in staff_accounts:
    user = db.query(User).filter(
        (func.lower(User.username) == username) | (func.lower(User.email) == email)
    ).first()

    if not user:
        user = User(
            email=email,
            username=username,
            hashed_password=hash_password("staff@123"),
            role=Role.staff.value,
            department=dept
        )
        db.add(user)
        print(f"Created staff user '{username}' for department '{dept}' (password='staff@123')")
    else:
        user.department = dept
        user.hashed_password = hash_password("staff@123")
        print(f"Updated staff user '{username}' for department '{dept}' (password='staff@123')")

db.commit()
db.close()
