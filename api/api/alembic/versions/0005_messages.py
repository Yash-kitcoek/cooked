"""add messages table

Revision ID: 0005_messages
Revises: 0004_student_profiles
"""

from alembic import op
import sqlalchemy as sa

revision = "0005_messages"
down_revision = "0004_student_profiles"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()

    result = conn.execute(
        sa.text(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_name='messages'"
        )
    )
    if result.fetchone():
        return

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("sender_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("recipient_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("complaint_id", sa.String(36), sa.ForeignKey("complaints.id"), nullable=True),
        sa.Column("subject", sa.String(255), nullable=False, server_default="No Subject"),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_messages_sender_id", "messages", ["sender_id"])
    op.create_index("ix_messages_recipient_id", "messages", ["recipient_id"])
    op.create_index("ix_messages_complaint_id", "messages", ["complaint_id"])


def downgrade():
    op.drop_index("ix_messages_complaint_id", table_name="messages")
    op.drop_index("ix_messages_recipient_id", table_name="messages")
    op.drop_index("ix_messages_sender_id", table_name="messages")
    op.drop_table("messages")
