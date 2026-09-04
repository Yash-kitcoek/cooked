"""add problem_group generated_brief fields

Revision ID: 0011_add_problem_group_brief
Revises: 0010_add_problem_group_emerging
Create Date: 2026-09-03
"""

from alembic import op
import sqlalchemy as sa


revision = "0011_add_problem_group_brief"
down_revision = "0010_user_profile_completed"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('problem_groups', sa.Column('generated_brief', sa.Text(), nullable=True))
    op.add_column('problem_groups', sa.Column('generated_brief_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('problem_groups', 'generated_brief_at')
    op.drop_column('problem_groups', 'generated_brief')
