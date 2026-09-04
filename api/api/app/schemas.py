from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

from app.models import ComplaintStatus, Role


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str | None = None
    username: str | None = None
    department: str | None = None
    profile_completed: bool = False


class LoginIn(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=8)

    model_config = {"extra": "forbid"}


class StudentRegister(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    department: str | None = None

    model_config = {"extra": "forbid"}


class UserCreate(BaseModel):
    email: EmailStr
    username: str | None = None
    password: str = Field(min_length=8)
    role: Role = Role.student
    department: str | None = None
    profile_completed: bool = False


class UserOut(BaseModel):
    id: int
    email: EmailStr
    username: str | None = None
    role: str
    department: str | None
    profile_completed: bool = False
    student_profile: "StudentProfileOut | None" = None

    model_config = {"from_attributes": True}


class SolutionIn(BaseModel):
    solution: str = Field(min_length=1, max_length=5000)


class FeedbackIn(BaseModel):
    accepted: bool
    comment: str | None = Field(default=None, max_length=2000)


class SolutionOut(BaseModel):
    complaint_id: str
    solution: str
    staff_id: int | None
    resolved_at: datetime | None


class ComplaintCreate(BaseModel):
    """Student complaint intake.

    ``force_new`` is used only after the student has been shown similar
    existing problems and explicitly chooses to continue with a genuinely
    new problem.
    """

    title: str = Field(min_length=3, max_length=240)
    description: str = Field(min_length=3)
    force_new: bool = False

    model_config = {"extra": "forbid"}


class SimilarProblemOut(BaseModel):
    id: UUID
    problem_code: str
    title: str
    description: str
    department: str
    complaint_count: int
    affected_users: int
    priority: str
    status: str
    similarity: float
    created_at: datetime

    model_config = {"from_attributes": True}


class ComplaintTransition(BaseModel):
    status: ComplaintStatus
    note: str | None = None


class AssignmentRequest(BaseModel):
    user_id: int
    note: str | None = Field(default=None, max_length=500)


class ReopenRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=500)


class ComplaintOut(BaseModel):
    id: str
    student_id: int
    department: str
    category: str
    subcategory: str | None
    classification_confidence: float
    title: str
    description: str
    status: str
    priority: str
    priority_reasons: list[str]
    source: str
    affected_users: int
    assigned_to_id: int | None
    problem_group_id: UUID | None = None
    sla_due_at: datetime
    duplicate_of_id: str | None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    solution_text: str | None
    solution_by_id: int | None
    solution_at: datetime | None
    feedback_accepted: bool | None
    feedback_comment: str | None
    feedback_at: datetime | None
    student_name: str | None = None
    student_email: str | None = None
    student_prn: str | None = None
    student_division: str | None = None
    student_roll_no: str | None = None
    student_year_semester: str | None = None
    student_contact: str | None = None

    model_config = {"from_attributes": True}
    

class ProblemStudentOut(BaseModel):
    user_id: int
    name: str | None = None
    email: str | None = None
    prn: str | None = None
    division: str | None = None
    roll_no: str | None = None
    year_semester: str | None = None
    contact_number: str | None = None


class ProblemComplaintOut(BaseModel):
    id: str
    student_id: int
    title: str
    description: str =""
    status: str
    priority: str
    created_at: datetime
    solution_text: str | None = None

    model_config = {"from_attributes": True}


class ProblemGroupStudentOut(BaseModel):
    """Student-safe projection of an active core problem."""

    id: UUID
    problem_code: str
    title: str
    description: str
    department: str
    complaint_count: int
    affected_users: int
    priority: str
    status: str
    solution_text: str | None = None
    solution_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    my_complaint_id: str | None = None
    my_complaint_status: str | None = None
    already_reported: bool = False

    model_config = {"from_attributes": True}


class ProblemReportOut(BaseModel):
    created: bool
    complaint_id: str
    problem_id: str
    status: str
    department: str
    assigned_to_id: int | None
    affected_users: int
    message: str


class ProblemGroupSummaryOut(BaseModel):
    id: str
    problem_code: str
    title: str
    description: str
    department: str
    category: str | None = None
    location: str | None = None
    complaint_count: int
    affected_users: int
    priority: str
    urgency_score: float
    impact_score: float
    priority_score: float
    status: str
    is_emerging: bool = False
    emerging_flagged_at: datetime | None = None
    generated_brief: str | None = None
    generated_brief_at: datetime | None = None
    solution_text: str | None = None
    solution_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProblemBriefOut(BaseModel):
    id: str
    generated_brief: str | None = None
    generated_brief_at: datetime | None = None

    model_config = {"from_attributes": True}


class EmergingAlertOut(BaseModel):
    id: str
    problem_code: str
    title: str
    department: str
    category: str
    location: str
    complaint_count: int
    velocity: float
    first_complaint_time: datetime
    latest_complaint_time: datetime | None = None
    emerging_flagged_at: datetime | None = None

    model_config = {"from_attributes": True}


# ── Public / Transparency Dashboard ───────────────────────────────────────────
# PRIVACY FENCE: These schemas are returned by the public GET /public/stats
# endpoint. They MUST NEVER contain:
#   - complaint titles, descriptions, or any free-text field
#   - student_id, email, username, PRN, division, roll_no, or any user identifier
#   - staff names, solution_by_id, or any personnel field
#   - storage_path, attachment URLs, or any complaint ID
#   - any field that could identify an individual complaint or complainant
# Only counts, averages, rates, and department/category labels are allowed.


class DeptStatsOut(BaseModel):
    name: str
    open_count: int
    resolved_count: int
    avg_resolution_hours: float | None  # None if no resolved complaints yet
    sla_breach_rate: float              # 0.0 – 1.0 fraction of active complaints past SLA


class TrendingCategoryOut(BaseModel):
    category: str
    count_last_7_days: int


class OverallStatsOut(BaseModel):
    total_open: int
    total_resolved_this_month: int
    avg_resolution_hours: float | None


class PublicStatsOut(BaseModel):
    departments: list[DeptStatsOut]
    trending_categories: list[TrendingCategoryOut]
    overall: OverallStatsOut
    last_updated: datetime




class ProblemGroupDetailOut(ProblemGroupSummaryOut):
    students: list[ProblemStudentOut] = []
    complaints: list[ProblemComplaintOut] = []


class AttachmentOut(BaseModel):
    id: int
    filename: str
    content_type: str
    size_bytes: int

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: int
    complaint_id: str | None
    channel: str
    recipient: str
    subject: str
    body: str
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class QueueStats(BaseModel):
    department: str
    open: int = 0
    in_progress: int = 0
    escalated: int = 0
    resolved: int = 0


class DepartmentOut(BaseModel):
    name: str
    category: str = "General"
    active: bool = True

    model_config = {"from_attributes": True}


class DepartmentOverview(BaseModel):
    department: str
    total: int = 0
    open: int = 0
    in_progress: int = 0
    resolved: int = 0
    overdue: int = 0


class NudgeRequest(BaseModel):
    message: str | None = None


class AuditEventOut(BaseModel):
    id: int
    actor_id: int | None
    action: str
    entity_type: str
    entity_id: str
    event_metadata: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentProfileIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    department: str = Field(min_length=1, max_length=120)
    prn_number: str = Field(min_length=1, max_length=50, pattern=r'^[0-9A-Za-z]{5,20}$')
    division: str = Field(min_length=1, max_length=10)
    roll_no: str = Field(min_length=1, max_length=30, pattern=r'^[0-9]+$')
    year_semester: str | None = Field(default=None, max_length=30)
    contact_number: str | None = Field(default=None, max_length=20)


class StudentProfileOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    department: str
    prn_number: str
    division: str
    roll_no: str
    year_semester: str | None
    contact_number: str | None
    updated_at: datetime

    model_config = {"from_attributes": True}


class StudentProfileAdminOut(BaseModel):
    id: int
    user_id: int
    full_name: str
    department: str
    prn_number: str
    division: str
    roll_no: str
    year_semester: str | None
    contact_number: str | None
    updated_at: datetime
    # denormalized user info
    user_email: str | None = None
    username: str | None = None

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: int
    complaint_id: str
    author_id: int
    author_name: str
    author_role: str
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    recipient_id: int
    complaint_id: str | None = None
    subject: str | None = None
    body: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    recipient_id: int
    recipient_name: str
    complaint_id: str | None
    subject: str
    body: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# Resolve forward reference: UserOut.student_profile references StudentProfileOut defined below
UserOut.model_rebuild()
