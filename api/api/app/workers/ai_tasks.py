from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models import Complaint, ComplaintEmbedding


def _session_factory():
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False)


_session_factory = lru_cache(maxsize=1)(_session_factory)


def _session():
    return _session_factory()()


def _deterministic_embedding(text: str) -> list[float]:
    seed = sum(ord(ch) for ch in text) or 1
    return [((seed + i * 31) % 997) / 997 for i in range(1536)]


def process_ai(complaint_id: str) -> None:
    db = _session()
    try:
        complaint = db.get(Complaint, complaint_id)
        if not complaint:
            return
        text = f"{complaint.title} {complaint.description}".lower()
        embedding = _deterministic_embedding(text)
        if db.bind and db.bind.dialect.name == "postgresql":
            distance = ComplaintEmbedding.embedding.l2_distance(embedding).label("distance")
            nearest = (
                db.query(ComplaintEmbedding, distance)
                .filter(ComplaintEmbedding.complaint_id != complaint.id)
                .order_by(distance)
                .first()
            )
            if nearest and nearest.distance < 0.15:
                complaint.duplicate_of_id = nearest.ComplaintEmbedding.complaint_id
        if not db.query(ComplaintEmbedding).filter_by(complaint_id=complaint.id).one_or_none():
            db.add(ComplaintEmbedding(complaint_id=complaint.id, embedding=embedding))
        db.commit()
    finally:
        db.close()
