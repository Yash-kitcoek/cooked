from datetime import timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Complaint, ComplaintStatus, utcnow


@pytest.fixture(autouse=True)
def disable_redis_cache_for_stats(monkeypatch):
    """Ensure stats are computed from the test DB, not a stale Redis cache in CI."""
    import app.api.routes.public as public_module
    monkeypatch.setattr(public_module, "_get_redis", lambda: None)
def test_public_stats_no_auth_required(client: TestClient):
    """GET /public/stats must be completely public — no Authorization header required."""
    res = client.get("/public/stats")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "departments" in data
    assert "trending_categories" in data
    assert "overall" in data
    assert "last_updated" in data


def test_public_stats_aggregation_and_sla_rates(client: TestClient, db: Session):
    """Verify department aggregation, SLA breach rate, resolution hours, and trending categories."""
    now = utcnow()
    student_id = 1  # seeded in conftest

    # 1. Hostel: 1 open breached complaint, 1 resolved complaint (took 4.0 hours)
    c1 = Complaint(
        student_id=student_id,
        department="Hostel",
        category="Water Supply",
        title="No water in Block B",
        description="Private complaint text",
        status=ComplaintStatus.open.value,
        created_at=now - timedelta(days=2),
        sla_due_at=now - timedelta(hours=5),  # breached!
    )
    c2 = Complaint(
        student_id=student_id,
        department="Hostel",
        category="Water Supply",
        title="Tap broken in Room 102",
        description="Another private text",
        status=ComplaintStatus.resolved.value,
        created_at=now - timedelta(hours=6),
        solution_at=now - timedelta(hours=2),  # 4 hours resolution
        solution_text="Fixed tap",
    )

    # 2. CSE: 1 in_progress complaint (not breached, sla in future)
    c3 = Complaint(
        student_id=student_id,
        department="CSE",
        category="Lab Equipment",
        title="Projector broken in Lab 3",
        description="Private text",
        status=ComplaintStatus.in_progress.value,
        created_at=now - timedelta(hours=1),
        sla_due_at=now + timedelta(hours=20),  # not breached
    )

    db.add_all([c1, c2, c3])
    db.commit()

    # Hit the public endpoint
    res = client.get("/public/stats")
    assert res.status_code == 200, res.text
    data = res.json()

    # Find Hostel in departments
    depts = {d["name"]: d for d in data["departments"]}
    assert "Hostel" in depts
    hostel = depts["Hostel"]
    assert hostel["open_count"] == 1
    assert hostel["resolved_count"] == 1
    assert hostel["sla_breach_rate"] == 1.0  # 1 open, 1 breached
    assert hostel["avg_resolution_hours"] == 4.0

    # Find CSE
    assert "CSE" in depts
    cse = depts["CSE"]
    assert cse["open_count"] == 1
    assert cse["resolved_count"] == 0
    assert cse["sla_breach_rate"] == 0.0

    # Trending categories: Water Supply (2) and Lab Equipment (1)
    categories = {t["category"]: t["count_last_7_days"] for t in data["trending_categories"]}
    assert categories.get("Water Supply") == 2
    assert categories.get("Lab Equipment") == 1

    # Overall stats
    overall = data["overall"]
    assert overall["total_open"] == 2
    assert overall["avg_resolution_hours"] == 4.0


def test_public_stats_strict_privacy_no_pii(client: TestClient, db: Session):
    """Verify that NO personally identifiable or sensitive fields exist in response."""
    now = utcnow()
    c = Complaint(
        student_id=1,
        department="Hostel",
        category="Sanitation",
        title="CONFIDENTIAL_COMPLAINT_TITLE",
        description="CONFIDENTIAL_STUDENT_DESCRIPTION_NEVER_LEAK",
        status=ComplaintStatus.open.value,
        created_at=now,
    )
    db.add(c)
    db.commit()

    res = client.get("/public/stats")
    assert res.status_code == 200
    raw_response = res.text

    # None of the confidential texts or sensitive keys may appear anywhere in the body
    assert "CONFIDENTIAL_COMPLAINT_TITLE" not in raw_response
    assert "CONFIDENTIAL_STUDENT_DESCRIPTION_NEVER_LEAK" not in raw_response
    assert "student_id" not in raw_response
    assert "student_email" not in raw_response
    assert "student_prn" not in raw_response
    assert "solution_by_id" not in raw_response
    assert "assigned_to_id" not in raw_response
    assert "storage_path" not in raw_response
    assert "feedback_comment" not in raw_response


def test_public_stats_caching_and_graceful_degradation(client: TestClient, monkeypatch):
    """Verify that Redis caching works and gracefully handles Redis exceptions."""
    import app.api.routes.public as public_module

    class DummyRedis:
        def __init__(self):
            self.store = {}
            self.get_calls = 0
            self.set_calls = 0

        def get(self, key):
            self.get_calls += 1
            return self.store.get(key)

        def setex(self, key, ttl, value):
            self.set_calls += 1
            self.store[key] = value

    dummy = DummyRedis()
    monkeypatch.setattr(public_module, "_get_redis", lambda: dummy)

    # First call: cache miss, sets cache
    res1 = client.get("/public/stats")
    assert res1.status_code == 200
    assert dummy.get_calls == 1
    assert dummy.set_calls == 1

    # Second call: cache hit
    res2 = client.get("/public/stats")
    assert res2.status_code == 200
    assert dummy.get_calls == 2
    assert dummy.set_calls == 1  # not called again

    # Verify graceful degradation if redis throws
    class FailingRedis:
        def get(self, key):
            raise ConnectionError("Redis is down")
        def setex(self, key, ttl, value):
            raise ConnectionError("Redis is down")

    monkeypatch.setattr(public_module, "_get_redis", lambda: FailingRedis())
    res3 = client.get("/public/stats")
    assert res3.status_code == 200  # Should still succeed via DB
