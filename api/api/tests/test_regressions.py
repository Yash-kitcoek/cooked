from sqlalchemy.dialects import postgresql

from app.config import settings
from app.models import Complaint, ComplaintEmbedding, Notification
from app.tasks import deliver
from tests.conftest import token


def test_vector_l2_distance_compiles_to_pgvector_operator():
    """TypeDecorator hides pgvector's comparator; without our own the AI job
    dies with AttributeError on PostgreSQL only, which SQLite tests never hit."""
    expr = ComplaintEmbedding.embedding.l2_distance([0.1, 0.2])
    assert "<->" in str(expr.compile(dialect=postgresql.dialect()))


def test_deliver_is_a_noop_when_smtp_unconfigured(db):
    notification = Notification(
        channel="email", recipient="head@example.edu", subject="s", body="b"
    )
    db.add(notification)
    db.commit()
    assert settings.smtp_host is None
    assert deliver(notification) is False


def make_complaint(client, student_token, title="Attach case"):
    return client.post(
        "/complaints",
        headers={"Authorization": f"Bearer {student_token}"},
        json={
            "title": title,
            "description": "Hostel water supply needs maintenance for residents.",
        },
    ).json()


def test_attachment_upload_then_list(client):
    student_token = token(client, "student@example.edu")
    complaint = make_complaint(client, student_token)
    created = client.post(
        f"/complaints/{complaint['id']}/attachments",
        headers={"Authorization": f"Bearer {student_token}"},
        files={"file": ("proof.pdf", b"%PDF-1.4 fake", "application/pdf")},
    )
    assert created.status_code == 201, created.text

    listed = client.get(
        f"/complaints/{complaint['id']}/attachments",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert [item["filename"] for item in listed.json()] == ["proof.pdf"]


def test_other_student_cannot_list_attachments(client):
    student_token = token(client, "student@example.edu")
    other_token = token(client, "other@example.edu")
    complaint = make_complaint(client, student_token)
    res = client.get(
        f"/complaints/{complaint['id']}/attachments",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert res.status_code == 404


def test_notifications_are_readable_and_department_scoped(client, db):
    admin_token = token(client, "admin@example.edu")
    staff_token = token(client, "hostel@example.edu")
    student_token = token(client, "student@example.edu")

    created = make_complaint(client, student_token, title="Breached case")
    complaint = db.get(Complaint, created["id"])
    complaint.sla_due_at = complaint.created_at
    db.commit()
    assert client.post("/admin/sla-check", headers={"Authorization": f"Bearer {admin_token}"}).json()["escalated"] == 1

    staff_view = client.get("/notifications", headers={"Authorization": f"Bearer {staff_token}"})
    assert [item["subject"] for item in staff_view.json()] == ["SLA escalated: Breached case"]

    student_view = client.get("/notifications", headers={"Authorization": f"Bearer {student_token}"})
    assert student_view.status_code == 403


def test_forwarded_ip_ignored_unless_proxy_is_trusted():
    from app.rate_limit import RateLimiter

    class FakeRequest:
        headers = {"x-forwarded-for": "1.2.3.4, 10.0.0.1"}
        client = type("C", (), {"host": "10.0.0.1"})()

    limiter = RateLimiter()
    assert limiter.client_ip(FakeRequest()) == "10.0.0.1"

    settings.trust_proxy_headers = True
    try:
        assert limiter.client_ip(FakeRequest()) == "1.2.3.4"
    finally:
        settings.trust_proxy_headers = False
