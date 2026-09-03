from uuid import uuid4
from datetime import datetime

from sqlalchemy import Column, String, Integer, DateTime, JSON
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

    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="problem_group")