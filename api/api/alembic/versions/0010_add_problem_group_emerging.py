"""add problem_group emerging fields

Revision ID: 0010_add_problem_group_emerging
Revises: 0009_add_problem_group_scores
Create Date: 2026-09-03
"""

from alembic import op
import sqlalchemy as sa


revision = "0010_add_problem_group_emerging"
down_revision = "0009_add_problem_group_scores"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('problem_groups', sa.Column('is_emerging', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('problem_groups', sa.Column('emerging_flagged_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('problem_groups', 'emerging_flagged_at')
    op.drop_column('problem_groups', 'is_emerging')
