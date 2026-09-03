"""Public complaint intake wrapper.

The client supplies only title + description.  This module derives the
internal impact signal by finding historical complaints that describe the
same problem.  The downstream complaint pipeline still owns classification,
priority, routing/SLA, and duplicate relation persistence.
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import Complaint
from app.pipeline.duplicate_detector import find_similar_complaints
from app.services.department_classifier import predict_department
from app.services.llm import analyze_complaint_with_llm


@dataclass(frozen=True)
class InternalComplaintPayload:
    title: str
    description: str
    department: str
    affected_users: int
    similar_complaints_count: int
    similar_complaint_ids: tuple[str, ...]
    category: str | None = None
    priority: str | None = None
    priority_reasons: list[str] | None = None


def build_payload(db: Session, title: str, description: str) -> InternalComplaintPayload:
    """Build the internal payload consumed by the existing complaint pipeline.

    A newly submitted complaint represents one affected student.  Every
    *distinct* student with a sufficiently similar historical complaint is
    counted once more.  This avoids inflating impact when one student has
    submitted the same complaint repeatedly.
    """
    clean_title = title.strip()
    clean_description = description.strip()
    
    allowed_departments = [
        "Hostel", "CSE", "AIML", "CSBS", "Mechanical", "Electrical", 
        "ENTC", "Biotech", "Exam Cell", "Canteen", "General Review"
    ]
    
    llm_result = analyze_complaint_with_llm(clean_title, clean_description, allowed_departments)
    
    if llm_result:
        department = llm_result.get("department", "General Review")
        category = llm_result.get("category")
        priority = llm_result.get("priority")
        priority_reasons = llm_result.get("priority_reasons", [])
    else:
        department = predict_department(f"{clean_title} {clean_description}")
        category = None
        priority = None
        priority_reasons = None

    matches = find_similar_complaints(
        db,
        clean_title,
        clean_description,
        department=department,
    )

    distinct_student_ids = {
        complaint.student_id
        for complaint, _score in matches
        if complaint.student_id is not None
    }

    return InternalComplaintPayload(
        title=clean_title,
        description=clean_description,
        department=department,
        affected_users=1 + len(distinct_student_ids),
        similar_complaints_count=len(matches),
        similar_complaint_ids=tuple(complaint.id for complaint, _score in matches),
        category=category,
        priority=priority,
        priority_reasons=priority_reasons,
    )
