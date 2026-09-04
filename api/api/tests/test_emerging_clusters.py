import uuid
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Complaint, ComplaintStatus, Priority, ProblemGroup
from app.workers.emerging_tasks import calculate_cluster_velocity, check_emerging_clusters
from tests.conftest import token


def test_velocity_calculation_and_guard():
    now = datetime(2026, 9, 3, 12, 0, 0, tzinfo=timezone.utc)
    # 6 complaints over 2 hours = 3.0 complaints/hour
    first_time = now - timedelta(hours=2)
    vel = calculate_cluster_velocity(6, first_time, now)
    assert vel == 3.0

    # 10 complaints over 30 minutes (0.5 hour) = 20.0 complaints/hour
    first_time_short = now - timedelta(minutes=30)
    vel_short = calculate_cluster_velocity(10, first_time_short, now)
    assert vel_short == 20.0

    # Zero count or None first_time
    assert calculate_cluster_velocity(0, first_time, now) == 0.0
    assert calculate_cluster_velocity(5, None, now) == 0.0

    # Guard: negative or instantaneous elapsed time uses minimum 1 minute
    future_time = now + timedelta(minutes=5)
    vel_guard = calculate_cluster_velocity(5, future_time, now)
    assert vel_guard > 0.0


def test_emerging_cluster_flagging_and_idempotency(db: Session):
    now = datetime.now(timezone.utc)
    student = db.query(Complaint).first()
    student_id = student.student_id if student else 1

    # Create a high-velocity cluster (6 complaints within 30 minutes)
    fast_group = ProblemGroup(
        id=uuid.uuid4(),
        problem_code="PROB-EMERGING1",
        title="Burst pipe flooding Block B corridor",
        description="Water everywhere on 2nd floor Block B",
        department="Hostel",
        status=ComplaintStatus.open.value,
        priority=Priority.urgent.value,
        complaint_count=6,
        created_at=now - timedelta(minutes=30),
    )
    db.add(fast_group)
    db.flush()

    for i in range(6):
        c = Complaint(
            id=str(uuid.uuid4()),
            student_id=student_id,
            department="Hostel",
            category="Infrastructure",
            title=f"Water leak {i} in Block B",
            description="Flooding",
            problem_group_id=fast_group.id,
            status=ComplaintStatus.open.value,
            created_at=now - timedelta(minutes=30 - i * 4),
        )
        db.add(c)

    # Create a low-velocity cluster (2 complaints over 10 hours)
    slow_group = ProblemGroup(
        id=uuid.uuid4(),
        problem_code="PROB-SLOW1",
        title="Broken study table in CSE Room 101",
        description="Desk wobble",
        department="CSE",
        status=ComplaintStatus.open.value,
        priority=Priority.low.value,
        complaint_count=2,
        created_at=now - timedelta(hours=10),
    )
    db.add(slow_group)
    db.flush()

    for i in range(2):
        c = Complaint(
            id=str(uuid.uuid4()),
            student_id=student_id,
            department="CSE",
            category="Maintenance",
            title=f"Study desk {i}",
            description="Broken leg",
            problem_group_id=slow_group.id,
            status=ComplaintStatus.open.value,
            created_at=now - timedelta(hours=10 - i * 2),
        )
        db.add(c)

    db.commit()

    # Run check
    flagged = check_emerging_clusters(db)
    flagged_ids = [str(g.id) for g in flagged]
    assert str(fast_group.id) in flagged_ids
    assert str(slow_group.id) not in flagged_ids

    db.refresh(fast_group)
    db.refresh(slow_group)

    assert fast_group.is_emerging is True
    assert fast_group.emerging_flagged_at is not None
    initial_flagged_at = fast_group.emerging_flagged_at
    assert slow_group.is_emerging is False

    # Verify location helper extracted Block B
    assert "Block B" in fast_group.location

    # Run check again: ensure timestamp is NOT overwritten (idempotent)
    check_emerging_clusters(db)
    db.refresh(fast_group)
    assert fast_group.emerging_flagged_at == initial_flagged_at

    # Resolve group and verify flag is cleared
    fast_group.status = ComplaintStatus.resolved.value
    db.commit()
    check_emerging_clusters(db)
    db.refresh(fast_group)
    assert fast_group.is_emerging is False


def test_alerts_emerging_endpoint_rbac_and_scoping(client: TestClient, db: Session):
    now = datetime.now(timezone.utc)
    student_token = token(client, "student@example.edu")
    hostel_staff_token = token(client, "hostel@example.edu")
    admin_token = token(client, "admin@example.edu")

    # 1. Student access is rejected with 403
    res = client.get("/alerts/emerging", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403

    # 2. Seed an emerging group in Hostel and another in Exam Cell
    hostel_group = ProblemGroup(
        id=uuid.uuid4(),
        problem_code="PROB-HSTL-EMERG",
        title="Major power outage in Hostel Block A",
        description="All rooms dark in Hostel Block A",
        department="Hostel",
        status=ComplaintStatus.open.value,
        is_emerging=True,
        emerging_flagged_at=now,
        complaint_count=8,
        created_at=now - timedelta(minutes=45),
    )
    exam_group = ProblemGroup(
        id=uuid.uuid4(),
        problem_code="PROB-EXAM-EMERG",
        title="Hall ticket server timing out",
        description="Server 504 errors on admit card portal",
        department="Exam Cell",
        status=ComplaintStatus.open.value,
        is_emerging=True,
        emerging_flagged_at=now,
        complaint_count=12,
        created_at=now - timedelta(minutes=30),
    )
    db.add_all([hostel_group, exam_group])
    db.commit()

    # 3. Staff (Hostel) only sees Hostel alert
    res_staff = client.get("/alerts/emerging", headers={"Authorization": f"Bearer {hostel_staff_token}"})
    assert res_staff.status_code == 200
    data_staff = res_staff.json()
    assert len(data_staff) == 1
    assert data_staff[0]["department"] == "Hostel"
    assert data_staff[0]["complaint_count"] == 8
    assert "location" in data_staff[0]
    assert "Block A" in data_staff[0]["location"]
    assert "category" in data_staff[0]
    assert "velocity" in data_staff[0]
    assert "first_complaint_time" in data_staff[0]

    # 4. Admin sees all departments
    res_admin = client.get("/alerts/emerging", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data_admin = res_admin.json()
    dept_names = {a["department"] for a in data_admin}
    assert "Hostel" in dept_names
    assert "Exam Cell" in dept_names

    # 5. Admin can trigger POST /admin/emerging-check
    res_check = client.post("/admin/emerging-check", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_check.status_code == 200
    assert "flagged" in res_check.json()

    # 6. Staff cannot trigger POST /admin/emerging-check
    res_check_forbidden = client.post("/admin/emerging-check", headers={"Authorization": f"Bearer {hostel_staff_token}"})
    assert res_check_forbidden.status_code == 403
