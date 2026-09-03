"""create problem_groups, problem_group_students, and complaints.problem_group_id

Revision ID: 000_problem_groups
Revises:
Create Date: 2026-08-26

The original version of this file was just a comment -- `alembic
upgrade head` would run and change nothing. This is a real revision.

ASSUMPTION: adjust `down_revision` below to point at whatever your
current latest migration is, and adjust the `complaints` table name /
id column type if it differs from `complaints.id : String`.
"""
from alembic import op
import sqlalchemy as sa

revision = '000_problem_groups'
down_revision = None  # <-- set this to your current head revision
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'problem_groups',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('problem_code', sa.String(), nullable=False, unique=True),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('department', sa.String(), nullable=False),
        sa.Column('priority', sa.String(), nullable=False, server_default='LOW'),
        sa.Column('complaint_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('distinct_student_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('embedding', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='OPEN'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_problem_groups_problem_code', 'problem_groups', ['problem_code'])
    op.create_index('ix_problem_groups_department', 'problem_groups', ['department'])

    op.create_table(
        'problem_group_students',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('problem_group_id', sa.String(),
                   sa.ForeignKey('problem_groups.id', ondelete='CASCADE'), nullable=False),
        sa.Column('student_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('problem_group_id', 'student_id', name='uq_problem_group_student'),
    )
    op.create_index('ix_problem_group_students_problem_group_id', 'problem_group_students', ['problem_group_id'])
    op.create_index('ix_problem_group_students_student_id', 'problem_group_students', ['student_id'])

    op.add_column('complaints', sa.Column('problem_group_id', sa.String(), nullable=True))
    op.create_foreign_key(
        'fk_complaints_problem_group_id',
        'complaints', 'problem_groups',
        ['problem_group_id'], ['id'],
        ondelete='SET NULL',
    )
    op.create_index('ix_complaints_problem_group_id', 'complaints', ['problem_group_id'])


def downgrade():
    op.drop_index('ix_complaints_problem_group_id', table_name='complaints')
    op.drop_constraint('fk_complaints_problem_group_id', 'complaints', type_='foreignkey')
    op.drop_column('complaints', 'problem_group_id')

    op.drop_index('ix_problem_group_students_student_id', table_name='problem_group_students')
    op.drop_index('ix_problem_group_students_problem_group_id', table_name='problem_group_students')
    op.drop_table('problem_group_students')

    op.drop_index('ix_problem_groups_department', table_name='problem_groups')
    op.drop_index('ix_problem_groups_problem_code', table_name='problem_groups')
    op.drop_table('problem_groups')
