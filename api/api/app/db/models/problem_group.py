from uuid import uuid4
from datetime import datetime

from sqlalchemy import Boolean, Column, String, Integer, DateTime, JSON, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class ProblemGroup(Base):
    __tablename__ = "problem_groups"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    problem_code = Column(String, unique=True, nullable=False, index=True)

    title = Column(String, nullable=False)
    department = Column(String, nullable=False)

    embedding = Column(JSON, nullable=True)

    complaint_count = Column(Integer, default=1)
    priority = Column(String, default="LOW")
    status = Column(String, default="OPEN")
    is_emerging = Column(Boolean, default=False, nullable=False)
    emerging_flagged_at = Column(DateTime(timezone=True), nullable=True)
    generated_brief = Column(Text, nullable=True)
    generated_brief_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="problem_group")