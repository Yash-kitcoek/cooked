from app.services.embedding_service import embed, cosine
from app.services.department_classifier import predict_department
from app.db.models.problem_group import ProblemGroup
THRESHOLD=0.84
def priority(n):
    return "CRITICAL" if n>=40 else "HIGH" if n>=15 else "MEDIUM" if n>=5 else "LOW"
class ProblemGroupingService:
    def process(self,db,text):
        dep=predict_department(text)
        vec=embed(text)
        groups=db.query(ProblemGroup).filter_by(department=dep).all()
        best=None; score=0
        for g in groups:
            if g.embedding:
                s=cosine(vec,g.embedding)
                if s>score: best,score=g,s
        if best and score>=THRESHOLD:
            best.complaint_count+=1
            best.priority=priority(best.complaint_count)
            db.commit(); db.refresh(best); return best
        code=f"PROB-{len(groups)+1:04d}"
        g=ProblemGroup(problem_code=code,title=text,department=dep,
            embedding=vec.tolist(),complaint_count=1,priority="LOW")
        db.add(g); db.commit(); db.refresh(g); return g
