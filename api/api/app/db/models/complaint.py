from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

problem_group_id = Column(
    String,
    ForeignKey("problem_groups.id"),
    nullable=True,
)

problem_group = relationship(
    "ProblemGroup",
    back_populates="complaints",
)