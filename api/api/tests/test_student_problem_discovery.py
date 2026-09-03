from tests.conftest import token


def test_student_can_discover_and_report_existing_problem(client):
    student_token = token(client, "student@example.edu")
    other_token = token(client, "other@example.edu")

    first = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Hostel Block A water outage",
            "description": "No water supply in Hostel Block A since morning.",
        },
    )
    assert first.status_code == 201, first.text

    groups = client.get(
        "/problems?department=Hostel&q=water",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert groups.status_code == 200, groups.text
    assert len(groups.json()) >= 1
    problem = groups.json()[0]
    assert problem["title"] == "Hostel Block A water outage"
    assert problem["already_reported"] is False
    assert problem["affected_users"] == 1

    report = client.post(
        f"/problems/{problem['id']}/report",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert report.status_code == 200, report.text
    body = report.json()
    assert body["created"] is True
    assert body["problem_id"] == problem["id"]
    assert body["department"] == "Hostel"

    mine = client.get(
        "/complaints",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert len(mine.json()) == 1
    assert mine.json()[0]["problem_group_id"] == problem["id"]

    repeat = client.post(
        f"/problems/{problem['id']}/report",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert repeat.status_code == 200
    assert repeat.json()["created"] is False
    assert repeat.json()["complaint_id"] == body["complaint_id"]


def test_group_solution_reaches_students_who_joined_existing_problem(client):
    student_token = token(client, "student@example.edu")
    other_token = token(client, "other@example.edu")
    staff_token = token(client, "hostel@example.edu")

    first = client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": "Hostel water outage",
            "description": "No water in Hostel Block A since morning.",
        },
    ).json()
    problem_id = first["problem_group_id"]

    joined = client.post(
        f"/problems/{problem_id}/report",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert joined.status_code == 200

    solution = client.put(
        f"/staff/problems/{problem_id}/solution",
        headers={"Authorization": f"Bearer {staff_token}"},
        json={"solution": "Water supply has been restored."},
    )
    assert solution.status_code == 200, solution.text
    assert solution.json()["complaint_count"] == 2

    other_complaints = client.get(
        "/complaints",
        headers={"Authorization": f"Bearer {other_token}"},
    ).json()
    assert other_complaints[0]["status"] == "resolved"
    assert other_complaints[0]["solution_text"] == "Water supply has been restored."
