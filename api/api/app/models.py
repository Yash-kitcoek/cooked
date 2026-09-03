import enum
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text, Uuid, UniqueConstraint
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import Text as TextType, TypeDecorator

try:
    from pgvector.sqlalchemy import Vector as PgVector
except Exception:  # pragma: no cover
    PgVector = None


class VectorType(TypeDecorator):
    impl = TextType
    cache_ok = True

    class Comparator(TypeDecorator.Comparator):
        def l2_distance(self, other):
            # TypeDecorator hides pgvector's own comparator, so bind the
            # `<->` operator here or every distance query raises AttributeError.
            return self.op("<->", return_type=Float)(other)

    comparator_factory = Comparator

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and PgVector:
            return dialect.type_descriptor(PgVector(1536))
        if dialect.name == "postgresql":
            return dialect.type_descriptor(postgresql.JSONB())
        return dialect.type_descriptor(JSON())


class Base(DeclarativeBase):
    pass


class Role(str, enum.Enum):
    student = "student"
    staff = "staff"
    department_head = "department_head"
    admin = "admin"


class ComplaintStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"
    escalated = "escalated"


class Priority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def default_sla_due() -> datetime:
    return utcnow() + timedelta(hours=48)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(120), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    department: Mapped[str | None] = mapped_column(String(120), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    complaints: Mapped[list["Complaint"]] = relationship(back_populates="student", foreign_keys="Complaint.student_id")
    student_profile: Mapped["StudentProfile | None"] = relationship(back_populates="user", uselist=False)


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(120), nullable=False)
    prn_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    division: Mapped[str] = mapped_column(String(10), nullable=False)
    roll_no: Mapped[str] = mapped_column(String(30), nullable=False)
    year_semester: Mapped[str | None] = mapped_column(String(30), nullable=True)
    contact_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    user: Mapped[User] = relationship(back_populates="student_profile")


class DepartmentPolicy(Base):
    __tablename__ = "department_policies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    keywords: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    sla_hours: Mapped[int] = mapped_column(Integer, default=48, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ProblemGroup(Base):
    """A single real-world problem represented by many student complaints.

    This is the department-facing unit of work. Individual complaints remain
    linked to their students and point to this group through problem_group_id.
    """

    __tablename__ = "problem_groups"

    id: Mapped[uuid.UUID] = mapped_column(
    Uuid(as_uuid=True),
    primary_key=True,
    default=uuid.uuid4,
    )
    problem_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    department: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(JSON, nullable=True)
    complaint_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    affected_users: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    priority: Mapped[str] = mapped_column(String(32), default=Priority.normal.value, nullable=False)
    urgency_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    impact_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    priority_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default=ComplaintStatus.open.value, nullable=False)
    solution_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    solution_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    complaints: Mapped[list["Complaint"]] = relationship(
        "Complaint",
        back_populates="problem_group",
        cascade="all, delete-orphan",
        foreign_keys="Complaint.problem_group_id",
    )
    
    @property
    def category(self) -> str | None:
        if self.complaints:
            return self.complaints[0].category
        return None
    solution_by: Mapped["User | None"] = relationship(foreign_keys=[solution_by_id])


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False, default="General")
    subcategory: Mapped[str | None] = mapped_column(String(120))
    classification_confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    priority_reasons: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="web", nullable=False)
    affected_users: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    assigned_to_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    problem_group_id: Mapped[uuid.UUID | None] = mapped_column(
    Uuid(as_uuid=True),
    ForeignKey("problem_groups.id"),
    index=True,
    nullable=True,
)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), index=True, default=ComplaintStatus.open.value, nullable=False)
    priority: Mapped[str] = mapped_column(String(32), index=True, default=Priority.normal.value, nullable=False)
    sla_due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=default_sla_due, index=True, nullable=False)
    duplicate_of_id: Mapped[str | None] = mapped_column(ForeignKey("complaints.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    solution_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    solution_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    feedback_accepted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    feedback_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    student: Mapped[User] = relationship(back_populates="complaints", foreign_keys=[student_id])
    problem_group: Mapped["ProblemGroup | None"] = relationship(back_populates="complaints", foreign_keys=[problem_group_id])
    attachments: Mapped[list["Attachment"]] = relationship(back_populates="complaint")

    @property
    def student_name(self) -> str | None:
        if self.student and self.student.student_profile and self.student.student_profile.full_name:
            return self.student.student_profile.full_name
        if self.student:
            return self.student.username or self.student.email
        return None

    @property
    def student_email(self) -> str | None:
        return self.student.email if self.student else None

    @property
    def student_prn(self) -> str | None:
        return self.student.student_profile.prn_number if (self.student and self.student.student_profile) else None

    @property
    def student_division(self) -> str | None:
        return self.student.student_profile.division if (self.student and self.student.student_profile) else None

    @property
    def student_roll_no(self) -> str | None:
        return self.student.student_profile.roll_no if (self.student and self.student.student_profile) else None

    @property
    def student_year_semester(self) -> str | None:
        return self.student.student_profile.year_semester if (self.student and self.student.student_profile) else None

    @property
    def student_contact(self) -> str | None:
        return self.student.student_profile.contact_number if (self.student and self.student.student_profile) else None



class ComplaintRelation(Base):
    __tablename__ = "complaint_relations"
    __table_args__ = (UniqueConstraint("source_complaint_id", "target_complaint_id", name="uq_complaint_relation"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id"), nullable=False, index=True)
    target_complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id"), nullable=False, index=True)
    relation_type: Mapped[str] = mapped_column(String(16), nullable=False)
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id"), index=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    complaint: Mapped[Complaint] = relationship(back_populates="attachments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    event_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"
    __table_args__ = (UniqueConstraint("user_id", "key", "method", "path", name="uq_idempotency_scope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    key: Mapped[str] = mapped_column(String(120), nullable=False)
    method: Mapped[str] = mapped_column(String(12), nullable=False)
    path: Mapped[str] = mapped_column(String(255), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    complaint_id: Mapped[str | None] = mapped_column(ForeignKey("complaints.id"), index=True)
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class ComplaintEmbedding(Base):
    __tablename__ = "complaint_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id"), unique=True, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(VectorType(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Comment(Base):
    __tablename__ = "complaint_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_id: Mapped[str] = mapped_column(ForeignKey("complaints.id"), index=True, nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    author: Mapped[User] = relationship()
    complaint: Mapped[Complaint] = relationship()

    @property
    def author_name(self) -> str:
        if self.author and self.author.student_profile:
            return self.author.student_profile.full_name
        if self.author:
            return self.author.username or self.author.email
        return "Unknown"

    @property
    def author_role(self) -> str:
        return self.author.role if self.author else "unknown"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    complaint_id: Mapped[str | None] = mapped_column(ForeignKey("complaints.id"), index=True, nullable=True)
    subject: Mapped[str] = mapped_column(String(255), nullable=False, default="No Subject")
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    sender: Mapped[User] = relationship(foreign_keys=[sender_id])
    recipient: Mapped[User] = relationship(foreign_keys=[recipient_id])
    complaint: Mapped[Complaint | None] = relationship()

    @property
    def sender_name(self) -> str:
        if self.sender and self.sender.student_profile:
            return self.sender.student_profile.full_name
        if self.sender:
            return self.sender.username or self.sender.email
        return "Unknown"

    @property
    def recipient_name(self) -> str:
        if self.recipient and self.recipient.student_profile:
            return self.recipient.student_profile.full_name
        if self.recipient:
            return self.recipient.username or self.recipient.email
        return "Unknown"

