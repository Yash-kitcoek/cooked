from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session, joinedload

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models import (
    Complaint,
    ComplaintStatus,
    ProblemGroup,
    Role,
    User,
)
from app.rbac import require_role
from app.schemas import (
    ProblemComplaintOut,
    ProblemGroupDetailOut,
    ProblemGroupSummaryOut,
    ProblemStudentOut,
    SolutionIn,
)
from app.services.problem_grouping import get_group_for_department, recalculate_group, resolve_problem_group

router = APIRouter(prefix="/staff/problems", tags=["department problems"])


def _check_access(current: User, group: ProblemGroup) -> None:
    require_role(current, Role.staff, Role.department_head, Role.admin)
    if current.role in {Role.staff.value, Role.department_head.value}:
        if group.department != current.department:
            raise HTTPException(status_code=404, detail="problem not found")


def _student_out(user: User) -> ProblemStudentOut:
    profile = user.student_profile
    return ProblemStudentOut(
        user_id=user.id,
        name=(profile.full_name if profile else None) or user.username or user.email,
        email=user.email,
        prn=profile.prn_number if profile else None,
        division=profile.division if profile else None,
        roll_no=profile.roll_no if profile else None,
        year_semester=profile.year_semester if profile else None,
        contact_number=profile.contact_number if profile else None,
    )


def _summary_query(db: Session, department: str | None):
    query = db.query(ProblemGroup).options(joinedload(ProblemGroup.complaints)).filter(
        ProblemGroup.status.in_([
            ComplaintStatus.open.value,
            ComplaintStatus.in_progress.value,
            ComplaintStatus.escalated.value,
            ComplaintStatus.resolved.value,
        ])
    )
    if department is not None:
        query = query.filter(ProblemGroup.department == department)
    priority_rank = case(
        (ProblemGroup.priority == "urgent", 4),
        (ProblemGroup.priority == "high", 3),
        (ProblemGroup.priority == "normal", 2),
        (ProblemGroup.priority == "low", 1),
        else_=0,
    )
    return query.order_by(
        # Department sees the most urgent/high-impact problems first.
        priority_rank.desc(),
        ProblemGroup.affected_users.desc(),
        ProblemGroup.created_at.desc(),
    )


@router.get("", response_model=list[ProblemGroupSummaryOut])
def list_problem_groups(
    priority: str | None = Query(default=None),
    status: str | None = Query(default=None),
    q: str | None = Query(default=None, min_length=1, max_length=120),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProblemGroup]:
    require_role(current, Role.staff, Role.department_head, Role.admin)

    department = None if current.role == Role.admin.value else current.department
    query = _summary_query(db, department)

    if priority:
        query = query.filter(ProblemGroup.priority == priority.lower())
    if status:
        query = query.filter(ProblemGroup.status == status.lower())
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                ProblemGroup.title.ilike(term),
                ProblemGroup.description.ilike(term),
                ProblemGroup.problem_code.ilike(term),
            )
        )

    groups = query.offset(offset).limit(limit).all()

    # Counters are derived from complaints so the dashboard can never become
    # stale because a frontend sent a wrong affected_users value.
    for group in groups:
        recalculate_group(db, group)
    db.commit()

    def _to_summary(group: ProblemGroup) -> ProblemGroupSummaryOut:
        return ProblemGroupSummaryOut(
            id=str(group.id),
            problem_code=group.problem_code,
            title=group.title,
            description=group.description,
            department=group.department,
            complaint_count=group.complaint_count,
            affected_users=group.affected_users,
            priority=group.priority,
            status=group.status,
            category=group.category,
            urgency_score=group.urgency_score,
            impact_score=group.impact_score,
            priority_score=group.priority_score,
            solution_text=group.solution_text,
            solution_at=group.solution_at,
            created_at=group.created_at,
            updated_at=group.updated_at,
        )

    return [_to_summary(group) for group in groups]


@router.get("/{problem_id}", response_model=ProblemGroupDetailOut)
def get_problem_group(
    problem_id: UUID,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProblemGroupDetailOut:
    group = (
        db.query(ProblemGroup)
        .filter(ProblemGroup.id == problem_id)
        .first()
    )
    if not group:
        raise HTTPException(status_code=404, detail="problem not found")

    _check_access(current, group)
    recalculate_group(db, group)

    complaints = (
        db.query(Complaint)
        .options(joinedload(Complaint.student).joinedload(User.student_profile))
        .filter(
            Complaint.problem_group_id == group.id,
            Complaint.deleted_at.is_(None),
        )
        .order_by(Complaint.created_at.desc())
        .all()
    )

    # Distinct students, even if one student filed multiple complaints.
    students_by_id: dict[int, ProblemStudentOut] = {}
    for complaint in complaints:
        if complaint.student:
            students_by_id[complaint.student.id] = _student_out(complaint.student)

    db.commit()

    return ProblemGroupDetailOut(
        id=str(group.id),
        problem_code=group.problem_code,
        title=group.title,
        description=group.description,
        department=group.department,
        complaint_count=group.complaint_count,
        affected_users=group.affected_users,
        priority=group.priority,
        status=group.status,
        category=group.category,
        urgency_score=group.urgency_score,
        impact_score=group.impact_score,
        priority_score=group.priority_score,
        solution_text=group.solution_text,
        solution_at=group.solution_at,
        created_at=group.created_at,
        updated_at=group.updated_at,
        students=list(students_by_id.values()),
        complaints=[ProblemComplaintOut.model_validate(c) for c in complaints]
    )


@router.put("/{problem_id}/solution", response_model=ProblemGroupDetailOut)
def solve_problem_group(
    problem_id: UUID,
    payload: SolutionIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProblemGroupDetailOut:
    """Resolve the real-world problem once and propagate the solution.

    Every active complaint in the group receives the same department solution.
    Individual student feedback can still reopen an individual complaint later.
    """
    group = db.query(ProblemGroup).filter(ProblemGroup.id == problem_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="problem not found")

    _check_access(current, group)

    complaints = (
        db.query(Complaint)
        .filter(
            Complaint.problem_group_id == group.id,
            Complaint.deleted_at.is_(None),
        )
        .all()
    )
    if not complaints:
        raise HTTPException(status_code=409, detail="problem has no active complaints")

    resolve_problem_group(db, group, payload.solution, current)
    db.commit()
    db.refresh(group)

    return get_problem_group(problem_id, current, db)
