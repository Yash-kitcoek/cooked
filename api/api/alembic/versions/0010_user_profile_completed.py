"""user profile completed

Revision ID: 0010_user_profile_completed
Revises: 0009_add_problem_group_scores
Create Date: 2026-09-01
"""

from alembic import op
import sqlalchemy as sa


revision = "0010_user_profile_completed"
down_revision = "0010_add_problem_group_emerging"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add the boolean column with default=False
    op.add_column('users', sa.Column('profile_completed', sa.Boolean(), server_default='false', nullable=False))
    
    # 2. Data migration
    bind = op.get_bind()
    
    # Set profile_completed = true for admin, staff, department_head
    bind.execute(sa.text("UPDATE users SET profile_completed = true WHERE role IN ('admin', 'staff', 'department_head')"))
    
    # Set profile_completed = true for students who already have a profile
    bind.execute(sa.text("UPDATE users SET profile_completed = true FROM student_profiles WHERE users.id = student_profiles.user_id AND users.role = 'student'"))


def downgrade() -> None:
    op.drop_column('users', 'profile_completed')
