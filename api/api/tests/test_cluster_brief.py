import uuid
from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Complaint, ComplaintStatus, ProblemGroup, utcnow
from app.services.brief_service import generate_cluster_brief


def token(client: TestClient, username: str) -> str:
    res = client.post("/auth/login", json={"username": username, "password": "password123"})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def test_generate_cluster_brief_service_and_caching(db: Session):
    """Test action brief generation, precedent retrieval, and caching logic."""
    now = utcnow()

    # 1. Past resolved cluster in same department with solution
    past_group = ProblemGroup(
        id=uuid.uuid4(),
        problem_code="PG-PAST-001",
        title="Main line leakage in Hostel Block B",
        description="Water pipe burst causing leakage",
        department="Hostel",
        status=ComplaintStatus.resolved.value,
        solution_text="Plumbing contractor replaced cracked iron pipe and valve in basement pump room",
        solution_at=now - timedelta(days=10),
    )
    db.add(past_group)
    db.commit()

    # 2. Current active cluster
    current_group = ProblemGroup(
        id=uuid.uuid4(),
        problem_code="PG-CURR-002",
        title="Severe water outage across Block B floors 2 and 3",
        description="Students have had no running water for over 24 hours",
        department="Hostel",
        complaint_count=3,
        affected_users=18,
        status=ComplaintStatus.open.value,
    )
    db.add(current_group)
    db.flush()

    # Add 3 complaints linked to this cluster
    for i in range(3):
        c = Complaint(
            student_id=1,
            department="Hostel",
            category="Water Supply",
            title=f"Block B Room {200 + i} has no tap water",
            description=f"Water stopped completely yesterday morning in room {200 + i}",
            problem_group_id=current_group.id,
            status=ComplaintStatus.open.value,
            created_at=now - timedelta(hours=5),
        )
        db.add(c)
    db.commit()
    db.refresh(current_group)

    # Generate brief
    brief = generate_cluster_brief(current_group.id, db, force=True)
    assert brief is not None
    assert len(brief) > 30

    # Verify DB caching
    db.refresh(current_group)
    assert current_group.generated_brief == brief
    assert current_group.generated_brief_at is not None

    saved_time = current_group.generated_brief_at

    # Second call without force should return cached brief instantly
    cached_brief = generate_cluster_brief(current_group.id, db, force=False)
    assert cached_brief == brief
    assert current_group.generated_brief_at == saved_time


def test_brief_api_endpoints_rbac_and_generation(client: TestClient, db: Session):
    """Test GET /staff/problems/{id} includes brief fields and POST /staff/problems/{id}/brief triggers generation."""
    now = utcnow()
    group_id = uuid.uuid4()
    group = ProblemGroup(
        id=group_id,
        problem_code="PG-TEST-003",
        title="Elevator stuck between 3rd and 4th floor",
        description="Lift in Hostel Block C malfunctioning",
        department="Hostel",
        status=ComplaintStatus.open.value,
        complaint_count=2,
        affected_users=12,
        created_at=now,
    )
    db.add(group)
    db.commit()

    # Staff token (hostel staff in conftest has username 'hostel')
    staff_token = token(client, "hostel")
    headers = {"Authorization": f"Bearer {staff_token}"}

    # 1. GET problem detail — should have generated_brief field (initially None)
    res = client.get(f"/staff/problems/{group_id}", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "generated_brief" in data
    assert "generated_brief_at" in data

    # 2. POST /staff/problems/{id}/brief — triggers generation
    res_post = client.post(f"/staff/problems/{group_id}/brief", headers=headers)
    assert res_post.status_code == 200, res_post.text
    brief_data = res_post.json()
    assert brief_data["id"] == str(group_id)
    assert brief_data["generated_brief"] is not None
    assert len(brief_data["generated_brief"]) > 20
    assert brief_data["generated_brief_at"] is not None

    # 3. GET problem detail now contains the cached brief
    res_after = client.get(f"/staff/problems/{group_id}", headers=headers)
    assert res_after.status_code == 200
    assert res_after.json()["generated_brief"] == brief_data["generated_brief"]

    # 4. Student token should be forbidden (RBAC)
    student_token = token(client, "student")
    res_forbidden = client.post(f"/staff/problems/{group_id}/brief", headers={"Authorization": f"Bearer {student_token}"})
    assert res_forbidden.status_code == 403


def test_brief_service_resilience_on_hf_failure(db: Session, monkeypatch):
    """Verify that if HuggingFace API times out or raises an error, the service falls back gracefully."""
    import app.services.brief_service as brief_module

    # Mock HF call to simulate network error or timeout
    def mock_hf_error(prompt):
        return None

    monkeypatch.setattr(brief_module, "call_hf_for_brief", mock_hf_error)

    group = ProblemGroup(
        id=uuid.uuid4(),
        problem_code="PG-FALLBACK-004",
        title="WiFi router dead in Library 2nd floor",
        description="No network access",
        department="Hostel",
        complaint_count=4,
        affected_users=30,
        status=ComplaintStatus.open.value,
    )
    db.add(group)
    db.commit()

    # Must NOT raise an exception; must return fallback brief
    brief = generate_cluster_brief(group.id, db, force=True)
    assert brief is not None
    assert "Incident cluster" in brief
    assert "PG-FALLBACK-004" not in brief  # Uses clean title
    assert group.title in brief
