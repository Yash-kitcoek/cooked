"""create complaint_comments table

Revision ID: 0008_complaint_comments
Revises: 0007_core_problem_groups
Create Date: 2026-08-28
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_complaint_comments"
down_revision = "0007_core_problem_groups"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "complaint_comments",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column(
            "complaint_id",
            sa.String(),
            sa.ForeignKey("complaints.id"),
            nullable=False,
        ),
        sa.Column(
            "author_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_complaint_comments_complaint_id",
        "complaint_comments",
        ["complaint_id"],
    )

    op.create_index(
        "ix_complaint_comments_author_id",
        "complaint_comments",
        ["author_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_complaint_comments_author_id",
        table_name="complaint_comments",
    )

    op.drop_index(
        "ix_complaint_comments_complaint_id",
        table_name="complaint_comments",
    )

    op.drop_table("complaint_comments")