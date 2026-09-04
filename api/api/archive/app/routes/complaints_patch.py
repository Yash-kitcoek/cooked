"""
How to wire this into your existing POST /complaints endpoint.

ASSUMPTION (adjust to match your real code): your Complaint model has
`description`, `student_id`, and `priority` columns, and your endpoint
already has `db: Session` and the authenticated student available.
If your field names differ, just change the attribute names below --
the grouping logic itself doesn't need to change.

--------------------------------------------------------------------
from app.services.problem_grouping import ProblemGroupingService

@router.post("/complaints")
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db),
                      current_student=Depends(get_current_student)):
    complaint = Complaint(
        description=payload.description,
        student_id=current_student.id,
    )
    db.add(complaint)
    db.flush()  # complaint.id available, not yet committed

    group = ProblemGroupingService().process(
        db=db,
        text_=payload.description,
        student_id=current_student.id,
    )
    complaint.problem_group_id = group.id
    complaint.priority = group.priority

    db.commit()
    db.refresh(complaint)
    return complaint
--------------------------------------------------------------------

Notes:
- ProblemGroupingService.process() already commits internally (it has
  to, in order to hold the per-department lock across its own
  read-then-write). Call it after you've flushed the Complaint row so
  problem_group_id can be set on the *same* row before the final
  commit, rather than requiring a second round-trip.
- If ProblemGroupingService.process() raises (bad input, DB error),
  let it propagate -- don't silently swallow it, or a complaint could
  get saved without ever being grouped/prioritized.
"""
