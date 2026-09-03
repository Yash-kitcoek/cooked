from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.audit import write_audit
from app.api.dependencies import get_current_user
from app.database import get_db
from app.models import Complaint, ComplaintStatus, ProblemGroup, Role, User, utcnow
from app.rbac import require_role
from app.schemas import ProblemGroupStudentOut, ProblemReportOut, SimilarProblemOut
from app.services.problem_grouping import problem_similarity, recalculate_group
from app.services.department_classifier import predict_department

router = APIRouter(prefix="/problems", tags=["student problem discovery"])

ACTIVE_GROUP_STATUSES = {
    ComplaintStatus.open.value,
    ComplaintStatus.in_progress.value,
    ComplaintStatus.escalated.value,
}
MAX_GROUP_CANDIDATES = 100

def _priority_rank():
    return case(
        (ProblemGroup.priority == "urgent", 4),
        (ProblemGroup.priority == "high", 3),
        (ProblemGroup.priority == "normal", 2),
        (ProblemGroup.priority == "low", 1),
        else_=0,
    )


@router.get("", response_model=list[ProblemGroupStudentOut])
def list_existing_problems(
    department: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    q: str | None = Query(default=None, min_length=1, max_length=120),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ProblemGroupStudentOut]:
    """Discover active real-world problems before creating a new complaint.

    Students see problem groups, not another student's private complaint data.
    A group represents one issue being handled by a department; joining it
    creates the student's own complaint linked to that group.
    """
    require_role(current, Role.student)

    query = db.query(ProblemGroup).filter(func.lower(ProblemGroup.status).in_(ACTIVE_GROUP_STATUSES))

    if department:
        query = query.filter(ProblemGroup.department == department.strip())
    if priority:
        query = query.filter(ProblemGroup.priority == priority.lower().strip())
    if status_filter:
        normalized_status = status_filter.lower().strip()
        if normalized_status not in ACTIVE_GROUP_STATUSES:
            return []
        query = query.filter(func.lower(ProblemGroup.status) == normalized_status)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(ProblemGroup.title.ilike(term), ProblemGroup.description.ilike(term)))

    groups = (
        query.order_by(
            _priority_rank().desc(),
            ProblemGroup.affected_users.desc(),
            ProblemGroup.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )

    if not groups:
        return []

    # Recalculate aggregate counters before rendering so the discovery feed
    # reflects the actual complaint membership in the database.
    for group in groups:
        recalculate_group(db, group)
    db.commit()

    group_ids = [group.id for group in groups]
    my_complaints = (
        db.query(Complaint)
        .filter(
            Complaint.student_id == current.id,
            Complaint.problem_group_id.in_(group_ids),
            Complaint.deleted_at.is_(None),
        )
        .order_by(Complaint.created_at.desc())
        .all()
    )

    # Keep the newest non-closed complaint per problem for the UI.
    mine: dict[str, Complaint] = {}
    for complaint in my_complaints:
        key = str(complaint.problem_group_id)
        if key not in mine or complaint.created_at > mine[key].created_at:
            mine[key] = complaint

    return [
        ProblemGroupStudentOut(
            id=group.id,
            problem_code=group.problem_code,
            title=group.title,
            description=group.description,
            department=group.department,
            complaint_count=group.complaint_count,
            affected_users=group.affected_users,
            priority=group.priority,
            status=group.status,
            solution_text=group.solution_text,
            solution_at=group.solution_at,
            created_at=group.created_at,
            updated_at=group.updated_at,
            my_complaint_id=(mine[str(group.id)].id if str(group.id) in mine and mine[str(group.id)].status != ComplaintStatus.closed.value else None),
            my_complaint_status=(mine[str(group.id)].status if str(group.id) in mine and mine[str(group.id)].status != ComplaintStatus.closed.value else None),
            already_reported=(str(group.id) in mine and mine[str(group.id)].status != ComplaintStatus.closed.value),
        )
        for group in groups
    ]


@router.get("/similar", response_model=list[SimilarProblemOut])
def suggest_similar_problems(
    title: str = Query(..., min_length=3, max_length=240),
    description: str = Query(default="", max_length=1000),
    department: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=5, ge=1, le=10),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Suggest active existing problems while a student is composing a complaint.

    This is a read-only recommendation endpoint: it never creates a complaint
    or changes grouping. The student can join a suggested problem or continue
    with a genuinely new complaint using ``force_new=true`` on POST /complaints.
    """
    require_role(current, Role.student)

    clean_title = title.strip()
    clean_description = description.strip()
    detected_department = department.strip() if department and department.strip() else predict_department(
        f"{clean_title} {clean_description}"
    )
    text = f"{clean_title}. {clean_description}".strip()

    query = db.query(ProblemGroup).filter(func.lower(ProblemGroup.status).in_(ACTIVE_GROUP_STATUSES))
    if detected_department:
        query = query.filter(ProblemGroup.department == detected_department)

    ranked = []
    for group in query.order_by(ProblemGroup.created_at.desc()).limit(MAX_GROUP_CANDIDATES).all():
        score = problem_similarity(text, f"{group.title}. {group.description}")
        if score >= 0.20:
            recalculate_group(db, group)
            ranked.append((group, score))

    ranked.sort(key=lambda item: (item[1], item[0].affected_users, item[0].created_at), reverse=True)
    db.commit()

    return [
        SimilarProblemOut(
            id=group.id,
            problem_code=group.problem_code,
            title=group.title,
            description=group.description,
            department=group.department,
            complaint_count=group.complaint_count,
            affected_users=group.affected_users,
            priority=group.priority,
            status=group.status,
            similarity=score,
            created_at=group.created_at,
        )
        for group, score in ranked[:limit]
    ]


@router.get("/{problem_id}", response_model=ProblemGroupStudentOut)
def get_existing_problem(
    problem_id: UUID,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProblemGroupStudentOut:
    require_role(current, Role.student)
    group = db.query(ProblemGroup).filter(ProblemGroup.id == problem_id).first()
    if not group or str(group.status).lower() not in ACTIVE_GROUP_STATUSES:
        raise HTTPException(status_code=404, detail="problem not found")

    recalculate_group(db, group)
    my = (
        db.query(Complaint)
        .filter(
            Complaint.student_id == current.id,
            Complaint.problem_group_id == group.id,
            Complaint.deleted_at.is_(None),
            Complaint.status != ComplaintStatus.closed.value,
        )
        .order_by(Complaint.created_at.desc())
        .first()
    )
    db.commit()

    return ProblemGroupStudentOut(
        id=group.id,
        problem_code=group.problem_code,
        title=group.title,
        description=group.description,
        department=group.department,
        complaint_count=group.complaint_count,
        affected_users=group.affected_users,
        priority=group.priority,
        status=group.status,
        solution_text=group.solution_text,
        solution_at=group.solution_at,
        created_at=group.created_at,
        updated_at=group.updated_at,
        my_complaint_id=my.id if my else None,
        my_complaint_status=my.status if my else None,
        already_reported=bool(my),
    )


@router.post("/{problem_id}/report", response_model=ProblemReportOut)
def report_existing_problem(
    problem_id: UUID,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProblemReportOut:
    """Create this student's ticket against an existing core problem.

    No new ProblemGroup is created. The ticket is assigned to the same
    department/staff queue, and future group-level resolution is propagated to
    this student's ticket as well.
    """
    require_role(current, Role.student)

    group = db.query(ProblemGroup).filter(ProblemGroup.id == problem_id).first()
    if not group or str(group.status).lower() not in ACTIVE_GROUP_STATUSES:
        raise HTTPException(status_code=404, detail="problem not found or no longer active")

    existing = (
        db.query(Complaint)
        .filter(
            Complaint.student_id == current.id,
            Complaint.problem_group_id == group.id,
            Complaint.deleted_at.is_(None),
            Complaint.status != ComplaintStatus.closed.value,
        )
        .order_by(Complaint.created_at.desc())
        .first()
    )
    if existing:
        return ProblemReportOut(
            created=False,
            complaint_id=existing.id,
            problem_id=str(group.id),
            status=existing.status,
            department=existing.department,
            assigned_to_id=existing.assigned_to_id,
            affected_users=group.affected_users,
            message="You have already reported this problem. Your existing complaint was returned.",
        )

    assignee = (
        db.query(User)
        .filter(
            User.department == group.department,
            User.role.in_([Role.staff.value, Role.department_head.value]),
        )
        .order_by(User.id)
        .first()
    )

    now = utcnow()
    complaint = Complaint(
        id=str(__import__("uuid").uuid4()),
        student_id=current.id,
        department=group.department,
        category=group.department,
        subcategory=None,
        classification_confidence=0.0,
        priority_reasons=["reported through an existing core problem"],
        source="existing_problem",
        affected_users=group.affected_users + 1,
        assigned_to_id=assignee.id if assignee else None,
        problem_group_id=group.id,
        title=group.title,
        description=group.description,
        status=group.status,
        priority=group.priority,
        sla_due_at=now,
    )
    db.add(complaint)
    db.flush()

    recalculate_group(db, group)
    write_audit(
        db,
        current,
        "complaint.joined_problem",
        "complaint",
        complaint.id,
        {
            "problem_group_id": str(group.id),
            "problem_code": group.problem_code,
            "department": group.department,
        },
    )
    db.commit()
    db.refresh(complaint)
    return ProblemReportOut(
        created=True,
        complaint_id=complaint.id,
        problem_id=str(group.id),
        status=complaint.status,
        department=complaint.department,
        assigned_to_id=complaint.assigned_to_id,
        affected_users=group.affected_users,
        message="Your complaint has been linked to the existing problem and routed to its department.",
    )
