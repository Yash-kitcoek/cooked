"""Staff-facing view of grouped complaints.

This is the piece that didn't exist before: an endpoint that shows
department staff the *core problems* (one row per problem_code) with
the distinct-student count, instead of a raw list of every complaint.

ASSUMPTIONS (adjust to match your real auth setup):
- You have some dependency that returns the logged-in staff user and
  exposes `.department` and `.role`. Replace `get_current_staff_user`
  with your real one.
- Only staff belonging to a department (or an admin) can view that
  department's board.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db  # adjust import path to your project
from app.db.models.problem_group import ProblemGroup
from app.api.deps import get_current_staff_user  # adjust import path to your project

router = APIRouter(prefix="/departments", tags=["department-dashboard"])


class ProblemGroupOut(BaseModel):
    problem_code: str
    title: str
    department: str
    priority: str
    status: str
    distinct_student_count: int
    complaint_count: int

    class Config:
        orm_mode = True


@router.get("/{department}/problems", response_model=List[ProblemGroupOut])
def list_department_problems(
    department: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    staff=Depends(get_current_staff_user),
):
    """Return one row per core problem for this department, sorted by
    how many distinct students reported it -- not one row per raw
    complaint.
    """
    if staff.role != "admin" and staff.department != department:
        raise HTTPException(status_code=403, detail="Not authorized for this department")

    query = db.query(ProblemGroup).filter(ProblemGroup.department == department)
    if status_filter:
        query = query.filter(ProblemGroup.status == status_filter)

    groups = (
        query.order_by(ProblemGroup.distinct_student_count.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return groups
