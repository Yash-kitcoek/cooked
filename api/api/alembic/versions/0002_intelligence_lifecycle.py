"""add intelligence and lifecycle fields

Revision ID: 0002_intelligence_lifecycle
Revises: 0001_initial
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_intelligence_lifecycle"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "department_policies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False, unique=True),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("keywords", sa.JSON(), nullable=False),
        sa.Column("sla_hours", sa.Integer(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column("complaints", sa.Column("category", sa.String(length=80), nullable=False, server_default="General"))
    op.add_column("complaints", sa.Column("subcategory", sa.String(length=120), nullable=True))
    op.add_column("complaints", sa.Column("classification_confidence", sa.Float(), nullable=False, server_default="0"))
    op.add_column("complaints", sa.Column("priority_reasons", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("complaints", sa.Column("source", sa.String(length=32), nullable=False, server_default="web"))
    op.add_column("complaints", sa.Column("affected_users", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("complaints", sa.Column("assigned_to_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("complaints", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_complaints_assigned_to_id", "complaints", ["assigned_to_id"])
    op.create_table(
        "complaint_relations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_complaint_id", sa.String(length=36), sa.ForeignKey("complaints.id"), nullable=False),
        sa.Column("target_complaint_id", sa.String(length=36), sa.ForeignKey("complaints.id"), nullable=False),
        sa.Column("relation_type", sa.String(length=16), nullable=False),
        sa.Column("similarity_score", sa.Float(), nullable=False),
        sa.Column("explanation", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("source_complaint_id", "target_complaint_id", name="uq_complaint_relation"),
    )
    op.bulk_insert(sa.table("department_policies", sa.column("name", sa.String), sa.column("category", sa.String), sa.column("keywords", sa.JSON), sa.column("sla_hours", sa.Integer), sa.column("active", sa.Boolean)), [
        {"name": "Hostel", "category": "Hostel", "keywords": ["hostel", "water", "mess", "room", "warden"], "sla_hours": 24, "active": True},
        {"name": "Exam Cell", "category": "Examinations", "keywords": ["exam", "result", "marks", "hallticket", "timetable"], "sla_hours": 24, "active": True},
        {"name": "Academics", "category": "Academics", "keywords": ["class", "course", "faculty", "attendance", "syllabus"], "sla_hours": 48, "active": True},
        {"name": "Infrastructure", "category": "Infrastructure", "keywords": ["electricity", "wifi", "internet", "road", "building"], "sla_hours": 48, "active": True},
    ])


def downgrade() -> None:
    op.drop_table("complaint_relations")
    op.drop_index("ix_complaints_assigned_to_id", table_name="complaints")
    for column in ("deleted_at", "assigned_to_id", "affected_users", "source", "priority_reasons", "classification_confidence", "subcategory", "category"):
        op.drop_column("complaints", column)
    op.drop_table("department_policies")
