import os
from collections.abc import Generator

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("JWT_SECRET", "test-secret-at-least-32-characters")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("UPLOAD_DIR", "test-uploads")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models import Base, Role, StudentProfile, User
from app.security import hash_password

engine = create_engine("sqlite+pysqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    u1 = User(email="student@example.edu", username="student", hashed_password=hash_password("password123"), role=Role.student.value, department=None)
    u2 = User(email="other@example.edu", username="other", hashed_password=hash_password("password123"), role=Role.student.value, department=None)
    u3 = User(email="hostel@example.edu", username="hostel", hashed_password=hash_password("password123"), role=Role.staff.value, department="Hostel")
    u4 = User(email="admin@example.edu", username="admin", hashed_password=hash_password("password123"), role=Role.admin.value, department=None)
    session.add_all([u1, u2, u3, u4])
    session.flush()
    session.add_all([
        StudentProfile(user_id=u1.id, full_name="Student User", department="Computer Science", prn_number="2425000001", division="A", roll_no="1"),
        StudentProfile(user_id=u2.id, full_name="Other Student", department="Computer Science", prn_number="2425000002", division="B", roll_no="2"),
    ])
    session.commit()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def token(client: TestClient, email: str) -> str:
    username = email.split("@")[0]
    res = client.post("/auth/login", json={"username": username, "password": "password123"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]
