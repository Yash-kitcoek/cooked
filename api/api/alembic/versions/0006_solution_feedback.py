"""add usernames, solutions, and student feedback"""

from alembic import op
import sqlalchemy as sa

revision = "0006_solution_feedback"
down_revision = "0005_messages"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    columns = {row[0] for row in bind.execute(sa.text(
        "SELECT column_name FROM information_schema.columns WHERE table_name='users'"
    ))}
    if "username" not in columns:
        op.add_column("users", sa.Column("username", sa.String(120), nullable=True))
        op.create_index("ix_users_username", "users", ["username"], unique=True)

    complaint_columns = {row[0] for row in bind.execute(sa.text(
        "SELECT column_name FROM information_schema.columns WHERE table_name='complaints'"
    ))}
    new_columns = (
        ("solution_text", sa.Text()),
        ("solution_by_id", sa.Integer()),
        ("solution_at", sa.DateTime(timezone=True)),
        ("feedback_accepted", sa.Boolean()),
        ("feedback_comment", sa.Text()),
        ("feedback_at", sa.DateTime(timezone=True)),
    )
    for name, column_type in new_columns:
        if name not in complaint_columns:
            foreign_key = [sa.ForeignKey("users.id")] if name == "solution_by_id" else []
            op.add_column("complaints", sa.Column(name, column_type, *foreign_key, nullable=True))


def downgrade() -> None:
    for name in ("feedback_at", "feedback_comment", "feedback_accepted", "solution_at", "solution_by_id", "solution_text"):
        op.drop_column("complaints", name)
    op.drop_index("ix_users_username", table_name="users")
    op.drop_column("users", "username")