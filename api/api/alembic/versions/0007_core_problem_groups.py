"""add department-facing core problem groups

Revision ID: 0007_core_problem_groups
Revises: 0006_solution_feedback
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_core_problem_groups"
down_revision = "0006_solution_feedback"
branch_labels = None
depends_on = None


def table_exists(bind, table_name: str) -> bool:
    return bool(
        bind.execute(
            sa.text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = current_schema()
                      AND table_name = :table_name
                )
                """
            ),
            {"table_name": table_name},
        ).scalar()
    )


def get_columns(bind, table_name: str) -> set[str]:
    return {
        row[0]
        for row in bind.execute(
            sa.text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = :table_name
                """
            ),
            {"table_name": table_name},
        )
    }


def get_indexes(bind, table_name: str) -> set[str]:
    return {
        row[0]
        for row in bind.execute(
            sa.text(
                """
                SELECT indexname
                FROM pg_indexes
                WHERE schemaname = current_schema()
                  AND tablename = :table_name
                """
            ),
            {"table_name": table_name},
        )
    }


def upgrade() -> None:
    bind = op.get_bind()

    # ============================================================
    # 1. CREATE problem_groups IF IT DOES NOT EXIST
    # ============================================================

    if not table_exists(bind, "problem_groups"):
        op.create_table(
            "problem_groups",
            sa.Column(
                "id",
                sa.UUID(),
                primary_key=True,
                nullable=False,
            ),
            sa.Column(
                "problem_code",
                sa.String(50),
                nullable=False,
                unique=True,
            ),
            sa.Column(
                "title",
                sa.Text(),
                nullable=False,
            ),
            sa.Column(
                "description",
                sa.Text(),
                nullable=True,
            ),
            sa.Column(
                "department",
                sa.String(100),
                nullable=False,
            ),
            sa.Column(
                "embedding",
                sa.JSON(),
                nullable=True,
            ),
            sa.Column(
                "complaint_count",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),
            sa.Column(
                "affected_users",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
            sa.Column(
                "priority",
                sa.String(20),
                nullable=True,
                server_default="LOW",
            ),
            sa.Column(
                "status",
                sa.String(20),
                nullable=True,
                server_default="OPEN",
            ),
            sa.Column(
                "solution_text",
                sa.Text(),
                nullable=True,
            ),
            sa.Column(
                "solution_by_id",
                sa.Integer(),
                sa.ForeignKey("users.id"),
                nullable=True,
            ),
            sa.Column(
                "solution_at",
                sa.DateTime(timezone=True),
                nullable=True,
            ),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=True,
            ),
        )

    else:
        # ========================================================
        # EXISTING TABLE
        # Add only columns that are missing.
        # ========================================================

        columns = get_columns(bind, "problem_groups")

        if "description" not in columns:
            op.add_column(
                "problem_groups",
                sa.Column(
                    "description",
                    sa.Text(),
                    nullable=True,
                ),
            )

        if "affected_users" not in columns:
            op.add_column(
                "problem_groups",
                sa.Column(
                    "affected_users",
                    sa.Integer(),
                    nullable=False,
                    server_default="0",
                ),
            )

        if "solution_text" not in columns:
            op.add_column(
                "problem_groups",
                sa.Column(
                    "solution_text",
                    sa.Text(),
                    nullable=True,
                ),
            )

        if "solution_by_id" not in columns:
            op.add_column(
                "problem_groups",
                sa.Column(
                    "solution_by_id",
                    sa.Integer(),
                    sa.ForeignKey("users.id"),
                    nullable=True,
                ),
            )

        if "solution_at" not in columns:
            op.add_column(
                "problem_groups",
                sa.Column(
                    "solution_at",
                    sa.DateTime(timezone=True),
                    nullable=True,
                ),
            )

        if "updated_at" not in columns:
            op.add_column(
                "problem_groups",
                sa.Column(
                    "updated_at",
                    sa.DateTime(timezone=True),
                    server_default=sa.func.now(),
                    nullable=True,
                ),
            )

    # ============================================================
    # 2. ADD problem_group_id TO complaints
    # ============================================================

    complaint_columns = get_columns(bind, "complaints")

    if "problem_group_id" not in complaint_columns:
        op.add_column(
            "complaints",
            sa.Column(
                "problem_group_id",
                sa.UUID(),
                sa.ForeignKey("problem_groups.id"),
                nullable=True,
            ),
        )

    indexes = get_indexes(bind, "complaints")

    if "ix_complaints_problem_group_id" not in indexes:
        op.create_index(
            "ix_complaints_problem_group_id",
            "complaints",
            ["problem_group_id"],
        )

    # ============================================================
    # 3. CREATE LEGACY GROUP FOR EXISTING COMPLAINTS
    # ============================================================
    #
    # IMPORTANT:
    #
    # problem_groups.id = UUID
    # complaints.id     = VARCHAR
    #
    # md5() produces 32 hexadecimal characters.
    # PostgreSQL can safely interpret that as a UUID.
    #
    # Therefore:
    #
    # md5('pg:' || c.id)::uuid
    #
    # ============================================================

    bind.execute(
        sa.text(
            """
            INSERT INTO problem_groups
            (
                id,
                problem_code,
                title,
                description,
                department,
                complaint_count,
                affected_users,
                priority,
                status,
                created_at,
                updated_at
            )
            SELECT
                md5('pg:' || c.id)::uuid,
                'LEGACY-' || left(md5(c.id), 8),
                c.title,
                c.description,
                c.department,
                1,
                1,
                COALESCE(c.priority, 'LOW'),
                CASE
                    WHEN LOWER(c.status) IN ('resolved', 'closed')
                    THEN 'RESOLVED'
                    ELSE 'OPEN'
                END,
                COALESCE(c.created_at, now()),
                now()
            FROM complaints c
            WHERE c.deleted_at IS NULL
              AND c.problem_group_id IS NULL
              AND NOT EXISTS
              (
                  SELECT 1
                  FROM problem_groups pg
                  WHERE pg.id = md5('pg:' || c.id)::uuid
              )
            """
        )
    )

    # ============================================================
    # 4. CONNECT COMPLAINTS TO THEIR LEGACY GROUP
    # ============================================================

    bind.execute(
        sa.text(
            """
            UPDATE complaints c
            SET problem_group_id =
                md5('pg:' || c.id)::uuid
            WHERE c.problem_group_id IS NULL
              AND c.deleted_at IS NULL
              AND EXISTS
              (
                  SELECT 1
                  FROM problem_groups pg
                  WHERE pg.id =
                        md5('pg:' || c.id)::uuid
              )
            """
        )
    )

    # ============================================================
    # 5. RECALCULATE AGGREGATES
    # ============================================================

    bind.execute(
        sa.text(
            """
            UPDATE problem_groups pg
            SET
                complaint_count = x.complaint_count,
                affected_users = x.affected_users,
                updated_at = now()
            FROM
            (
                SELECT
                    problem_group_id,
                    COUNT(*) AS complaint_count,
                    COUNT(DISTINCT student_id) AS affected_users
                FROM complaints
                WHERE problem_group_id IS NOT NULL
                  AND deleted_at IS NULL
                GROUP BY problem_group_id
            ) x
            WHERE pg.id = x.problem_group_id
            """
        )
    )

    # ============================================================
    # 6. INDEXES FOR DEPARTMENT DASHBOARD
    # ============================================================

    indexes = get_indexes(bind, "problem_groups")

    if "ix_problem_groups_department" not in indexes:
        op.create_index(
            "ix_problem_groups_department",
            "problem_groups",
            ["department"],
        )

    if "ix_problem_groups_status" not in indexes:
        op.create_index(
            "ix_problem_groups_status",
            "problem_groups",
            ["status"],
        )


def downgrade() -> None:
    bind = op.get_bind()

    if table_exists(bind, "complaints"):
        columns = get_columns(bind, "complaints")

        if "problem_group_id" in columns:
            indexes = get_indexes(bind, "complaints")

            if "ix_complaints_problem_group_id" in indexes:
                op.drop_index(
                    "ix_complaints_problem_group_id",
                    table_name="complaints",
                )

            op.drop_column(
                "complaints",
                "problem_group_id",
            )

    if table_exists(bind, "problem_groups"):
        indexes = get_indexes(bind, "problem_groups")

        if "ix_problem_groups_department" in indexes:
            op.drop_index(
                "ix_problem_groups_department",
                table_name="problem_groups",
            )

        if "ix_problem_groups_status" in indexes:
            op.drop_index(
                "ix_problem_groups_status",
                table_name="problem_groups",
            )

        op.drop_table("problem_groups")