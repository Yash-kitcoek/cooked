from app.models import Complaint, User
from tests.conftest import token


def test_student_creates_and_sees_only_own_history(client):
    student_token = token(client, "student@example.edu")
    other_token = token(client, "other@example.edu")
    first = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}", "Idempotency-Key": "case-1"},
        json={"title": "Room fan broken", "description": "Fan has been broken for three days."},
    )
    assert first.status_code == 201, first.text
    replay = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}", "Idempotency-Key": "case-1"},
        json={"title": "Room fan broken", "description": "Fan has been broken for three days."},
    )
    assert replay.status_code == 201
    assert replay.json()["id"] == first.json()["id"]

    own = client.get("/complaints", headers={"Authorization": f"Bearer {student_token}"})
    other = client.get("/complaints", headers={"Authorization": f"Bearer {other_token}"})
    assert len(own.json()) == 1
    assert other.json() == []


def test_staff_department_queue_and_transition(client):
    student_token = token(client, "student@example.edu")
    staff_token = token(client, "hostel@example.edu")
    created = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "Water issue", "description": "No water in block A washroom."},
    ).json()
    queue = client.get("/complaints", headers={"Authorization": f"Bearer {staff_token}"})
    assert [item["id"] for item in queue.json()] == [created["id"]]
    transitioned = client.patch(
        f"/complaints/{created['id']}/transition",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"status": "in_progress", "note": "Assigned to maintenance"},
    )
    assert transitioned.status_code == 200
    assert transitioned.json()["status"] == "in_progress"


def test_invalid_transition_blocked(client):
    student_token = token(client, "student@example.edu")
    staff_token = token(client, "hostel@example.edu")
    complaint = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "Mess issue", "description": "Food quality issue in mess."},
    ).json()
    res = client.patch(
        f"/complaints/{complaint['id']}/transition",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"status": "closed"},
    )
    assert res.status_code == 409


def test_assignment_reopen_and_timeline(client, db):
    student_token = token(client, "student@example.edu")
    staff_token = token(client, "hostel@example.edu")
    created = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "Hostel water outage", "description": "Hostel water supply is unavailable for all residents."},
    ).json()
    staff_id = db.query(User).filter_by(email="hostel@example.edu").one().id
    assigned = client.post(
        f"/complaints/{created['id']}/assign",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"user_id": staff_id, "note": "Maintenance owner"},
    )
    assert assigned.status_code == 200
    assert assigned.json()["assigned_to_id"] == staff_id
    assert client.patch(
        f"/complaints/{created['id']}/transition",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"status": "resolved"},
    ).status_code == 200
    reopened = client.post(
        f"/complaints/{created['id']}/reopen",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"reason": "Water supply has not resumed."},
    )
    assert reopened.status_code == 200
    assert reopened.json()["status"] == "in_progress"
    events = client.get(f"/complaints/{created['id']}/timeline", headers={"Authorization": f"Bearer {student_token}"})
    assert [event["action"] for event in events.json()] == ["complaint.created", "complaint.assigned", "complaint.transitioned", "complaint.reopened"]


def test_sla_escalation(client, db):
    admin_token = token(client, "admin@example.edu")
    student_token = token(client, "student@example.edu")
    created = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "Old case", "description": "This complaint breached deadline."},
    ).json()
    complaint = db.get(Complaint, created["id"])
    complaint.sla_due_at = complaint.created_at
    db.commit()
    res = client.post("/admin/sla-check", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    assert res.json()["escalated"] == 1


def test_public_intake_rejects_internal_fields(client):
    student_token = token(client, "student@example.edu")
    res = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Water issue",
            "description": "No water in hostel block A.",
            "affected_users": 999,
        },
    )
    assert res.status_code == 422


def test_similar_complaints_increase_affected_users(client):
    first_token = token(client, "student@example.edu")
    second_token = token(client, "other@example.edu")

    first = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {first_token}"},
        json={"title": "Hostel Block A water outage", "description": "No water in Hostel Block A since morning."},
    )
    assert first.status_code == 201, first.text
    assert first.json()["affected_users"] == 1

    second = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {second_token}"},
        json={"title": "No water in Hostel Block A", "description": "Hostel Block A water supply has been unavailable since morning."},
    )
    assert second.status_code == 201, second.text
    assert second.json()["affected_users"] == 2
    assert second.json()["department"] == "Hostel"
