"""add problem_group scores

Revision ID: 0009_add_problem_group_scores
Revises: 0008_complaint_comments
Create Date: 2026-08-29
"""

from alembic import op
import sqlalchemy as sa


revision = "0009_add_problem_group_scores"
down_revision = "0008_complaint_comments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('problem_groups', sa.Column('urgency_score', sa.Float(), server_default='0', nullable=False))
    op.add_column('problem_groups', sa.Column('impact_score', sa.Float(), server_default='0', nullable=False))
    op.add_column('problem_groups', sa.Column('priority_score', sa.Float(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('problem_groups', 'priority_score')
    op.drop_column('problem_groups', 'impact_score')
    op.drop_column('problem_groups', 'urgency_score')
