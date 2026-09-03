"""add student_profiles table

Revision ID: 0004_student_profiles
Revises: 0003_complaint_soft_delete
"""

from alembic import op
import sqlalchemy as sa

revision = "0004_student_profiles"
down_revision = "0003_complaint_soft_delete"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    # Check if table already exists
    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_name='student_profiles'"
        )
    )
    if result.fetchone():
        return

    op.create_table(
        "student_profiles",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("department", sa.String(120), nullable=False),
        sa.Column("prn_number", sa.String(50), nullable=False, unique=True),
        sa.Column("division", sa.String(10), nullable=False),
        sa.Column("roll_no", sa.String(30), nullable=False),
        sa.Column("year_semester", sa.String(30), nullable=True),
        sa.Column("contact_number", sa.String(20), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
        ),
    )


def downgrade():
    op.drop_table("student_profiles")
