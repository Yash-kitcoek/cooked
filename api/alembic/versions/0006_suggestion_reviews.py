"""suggestion_reviews table

Revision ID: 0006_suggestion_reviews
Revises: 0005_messages
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_suggestion_reviews"
down_revision = "0005_messages"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "suggestion_reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cluster_key", sa.String(length=255), nullable=False),
        sa.Column("reviewed_by_id", sa.Integer(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["reviewed_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cluster_key")
    )


def downgrade():
    op.drop_table("suggestion_reviews")
