from app.models import AuditLog, Notification
from tests.conftest import token


def test_get_departments(client):
    res = client.get("/departments")
    assert res.status_code == 200
    depts = res.json()
    assert len(depts) == 11
    dept_names = [d["name"] for d in depts]
    assert "Hostel" in dept_names
    assert "CSE" in dept_names
    assert "Canteen" in dept_names
    assert "General Review" in dept_names


def test_complaint_department_validation(client):
    student_token = token(client, "student@example.edu")
    
    # Department is now inferred from title/description.
    valid_res = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "CSE Lab PC not working", "description": "PC #12 in the CSE lab won't boot."},
    )
    assert valid_res.status_code == 201
    assert valid_res.json()["department"] == "CSE"

    # Supplying an internal field is rejected by the public intake contract.
    invalid_res = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"department": "UnknownDept", "title": "Test invalid", "description": "Testing unknown department."},
    )
    assert invalid_res.status_code == 422


def test_admin_departments_overview(client):
    student_token = token(client, "student@example.edu")
    admin_token = token(client, "admin@example.edu")
    
    # File complaints in CSE and AIML
    client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "CSE Issue 1", "description": "CSE laboratory computer issue."},
    )
    client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "AIML Issue 1", "description": "AIML laboratory equipment issue."},
    )

    overview_res = client.get("/admin/departments/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert overview_res.status_code == 200
    data = overview_res.json()
    
    cse_data = next((d for d in data if d["department"] == "CSE"), None)
    assert cse_data is not None
    assert cse_data["total"] >= 1
    assert cse_data["open"] >= 1


def test_admin_nudge_complaint(client, db):
    student_token = token(client, "student@example.edu")
    admin_token = token(client, "admin@example.edu")
    
    created = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "Nudge test", "description": "Hostel issue for nudge"},
    ).json()

    nudge_res = client.post(
        f"/admin/complaints/{created['id']}/nudge",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"message": "Expedite this hostel issue!"},
    )
    assert nudge_res.status_code == 200
    assert nudge_res.json()["status"] == "success"

    # Verify notification created
    notif = db.query(Notification).filter_by(complaint_id=created["id"]).first()
    assert notif is not None
    assert "Expedite" in notif.body

    # Verify audit log created
    audit = db.query(AuditLog).filter_by(action="admin.nudge", entity_id=created["id"]).first()
    assert audit is not None


def test_admin_nudge_department(client, db):
    student_token = token(client, "student@example.edu")
    admin_token = token(client, "admin@example.edu")

    client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "Biotech Lab issue", "description": "Biotech equipment calibration issue."},
    )

    nudge_res = client.post(
        "/admin/departments/Biotech/nudge",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"message": "Please clear Biotech queue"},
    )
    assert nudge_res.status_code == 200
    assert nudge_res.json()["affected_complaints"] >= 1
