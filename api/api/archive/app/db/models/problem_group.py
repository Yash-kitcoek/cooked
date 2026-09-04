from sqlalchemy import Column,String,Integer,DateTime,JSON
from datetime import datetime
import uuid
from app.db.base import Base
class ProblemGroup(Base):
    __tablename__="problem_groups"
    id=Column(String,primary_key=True,default=lambda:str(uuid.uuid4()))
    problem_code=Column(String,unique=True,index=True)
    title=Column(String)
    department=Column(String,index=True)
    embedding=Column(JSON)
    complaint_count=Column(Integer,default=1)
    priority=Column(String,default="LOW")
    status=Column(String,default="OPEN")
    created_at=Column(DateTime,default=datetime.utcnow)
