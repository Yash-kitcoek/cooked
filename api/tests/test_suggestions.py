import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Complaint, SuggestionReview
from tests.conftest import token


def test_student_cannot_access_suggestions(client: TestClient, db: Session):
    c = Complaint(student_id=1, department="Hostel", title="test", description="test")
    db.add(c)
    db.commit()

    tok = token(client, "student@example.edu")
    res = client.get(f"/dashboard/complaints/{c.id}/suggestion", headers={"Authorization": f"Bearer {tok}"})
    assert res.status_code == 403  # Student not allowed to view suggestions


def test_staff_can_get_suggestion_and_stats(client: TestClient, db: Session):
    c1 = Complaint(student_id=1, department="Hostel", title="test", description="test", priority="high", priority_reasons=["water"])
    c2 = Complaint(student_id=1, department="Hostel", title="dup", description="dup")
    db.add_all([c1, c2])
    db.commit()
    c2.duplicate_of_id = c1.id
    db.commit()

    tok = token(client, "hostel@example.edu")
    res = client.get(f"/dashboard/complaints/{c1.id}/suggestion", headers={"Authorization": f"Bearer {tok}"})
    assert res.status_code == 200
    assert "URGENT" in res.json()["suggestion"]
    assert "water" in res.json()["suggestion"]

    res_stats = client.get(f"/dashboard/complaints/{c1.id}/stats", headers={"Authorization": f"Bearer {tok}"})
    assert res_stats.status_code == 200
    assert res_stats.json()["cluster_size"] == 2


def test_admin_suggestions(client: TestClient, db: Session):
    # create a cluster of 3
    db.add_all([
        Complaint(student_id=1, department="Hostel", category="Maintenance", title="1", description="1"),
        Complaint(student_id=1, department="Hostel", category="Maintenance", title="2", description="2"),
        Complaint(student_id=1, department="Hostel", category="Maintenance", title="3", description="3"),
    ])
    db.commit()

    # staff cannot access admin routes
    tok_staff = token(client, "hostel@example.edu")
    res = client.get("/admin/suggestions", headers={"Authorization": f"Bearer {tok_staff}"})
    assert res.status_code == 403

    tok_admin = token(client, "admin@example.edu")
    res = client.get("/admin/suggestions", headers={"Authorization": f"Bearer {tok_admin}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    cluster = next(c for c in data if c["department"] == "Hostel" and c["category"] == "Maintenance")
    key = cluster["cluster_key"]
    assert cluster["no_of_applications"] >= 3

    # get improvement
    res = client.get(f"/admin/suggestions/{key}/improvement", headers={"Authorization": f"Bearer {tok_admin}"})
    assert res.status_code == 200
    assert "Hostel/Maintenance" in res.json()["improved_solution"]

    # resolve suggestion
    res = client.post(f"/admin/suggestions/{key}/resolve", json={"note": "Fixed process"}, headers={"Authorization": f"Bearer {tok_admin}"})
    assert res.status_code == 200
    
    # cluster should no longer appear
    res = client.get("/admin/suggestions", headers={"Authorization": f"Bearer {tok_admin}"})
    assert res.status_code == 200
    assert not any(c["cluster_key"] == key for c in res.json())
