from tests.conftest import token


def test_student_can_register_but_cannot_set_a_role(client):
    created = client.post(
        "/auth/register",
        json={"email": "new.student@example.edu", "username": "newstudent", "password": "StudentPass123!"},
    )
    assert created.status_code == 201, created.text
    assert created.json()["role"] == "student"
    assert client.post(
        "/auth/register",
        json={"email": "new.student@example.edu", "username": "newstudent", "password": "StudentPass123!"},
    ).status_code == 409
    assert client.post(
        "/auth/register",
        json={"email": "bad@example.edu", "username": "baduser", "password": "StudentPass123!", "role": "admin"},
    ).status_code == 422


def test_student_cannot_access_staff_dashboard(client):
    student_token = token(client, "student@example.edu")
    res = client.get("/dashboard/department", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403


def test_staff_cannot_create_user(client):
    staff_token = token(client, "hostel@example.edu")
    res = client.post(
        "/users",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"email": "new@example.edu", "password": "password123", "role": "student"},
    )
    assert res.status_code == 403


def test_attachment_validation(client):
    student_token = token(client, "student@example.edu")
    complaint = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={"title": "Hostel upload case", "description": "Need attach proof for this hostel complaint."},
    ).json()
    res = client.post(
        f"/complaints/{complaint['id']}/attachments",
        headers={"Authorization": f"Bearer {student_token}"},
        files={"file": ("bad.exe", b"nope", "application/x-msdownload")},
    )
    assert res.status_code == 415
