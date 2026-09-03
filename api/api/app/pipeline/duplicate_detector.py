"""Duplicate/related complaint detection used by both intake and persistence."""

import re

from sqlalchemy.orm import Session

from app.models import Complaint, ComplaintRelation


RELATED_THRESHOLD = 0.35
DUPLICATE_THRESHOLD = 0.70
MAX_CANDIDATES = 500


# Small normalization layer keeps the deterministic demo matcher useful for
# common wording differences without pretending to be a real embedding model.
_NORMALIZATION = {
    "unavailable": "no",
    "absent": "no",
    "missing": "no",
    "supply": "water",
    "supplies": "water",
    "washroom": "bathroom",
    "washrooms": "bathroom",
    "residents": "students",
    "resident": "student",
}


def tokens(text: str) -> set[str]:
    raw = {word for word in re.findall(r"[a-z0-9]+", text.lower()) if len(word) > 2}
    return {_NORMALIZATION.get(word, word) for word in raw}


def similarity(left: str, right: str) -> float:
    left_tokens, right_tokens = tokens(left), tokens(right)
    if not left_tokens or not right_tokens:
        return 0.0
    intersection = len(left_tokens & right_tokens)
    union = len(left_tokens | right_tokens)
    return intersection / union if union else 0.0


def find_similar_complaints(
    db: Session,
    title: str,
    description: str,
    department: str | None = None,
    threshold: float = RELATED_THRESHOLD,
    limit: int = MAX_CANDIDATES,
) -> list[tuple[Complaint, float]]:
    """Return historical active complaints similar to the incoming text."""
    text = f"{title} {description}"
    query = db.query(Complaint).filter(Complaint.deleted_at.is_(None))
    if department:
        query = query.filter(Complaint.department == department)
    query = query.order_by(Complaint.created_at.desc()).limit(limit)

    matches: list[tuple[Complaint, float]] = []
    for candidate in query.all():
        score = similarity(text, f"{candidate.title} {candidate.description}")
        if score >= threshold:
            matches.append((candidate, score))

    matches.sort(key=lambda item: item[1], reverse=True)
    return matches


def detect_duplicates(db: Session, complaint: Complaint, text: str | None = None) -> None:
    """Persist relations for all relevant historical matches.

    The complaint is flushed before this stage, so its ID is available.
    """
    complaint_text = text or f"{complaint.title} {complaint.description}"
    candidates = (
        db.query(Complaint)
        .filter(
            Complaint.id != complaint.id,
            Complaint.deleted_at.is_(None),
            Complaint.department == complaint.department,
        )
        .order_by(Complaint.created_at.desc())
        .limit(MAX_CANDIDATES)
        .all()
    )

    ranked: list[tuple[Complaint, float]] = []
    for candidate in candidates:
        score = similarity(complaint_text, f"{candidate.title} {candidate.description}")
        if score >= RELATED_THRESHOLD:
            ranked.append((candidate, score))

    ranked.sort(key=lambda item: item[1], reverse=True)
    if not ranked:
        return

    # The strongest match is the canonical duplicate, while all sufficiently
    # similar complaints remain visible as RELATED/DUPLICATE relations.
    strongest_duplicate = next(
        ((candidate, score) for candidate, score in ranked if score >= DUPLICATE_THRESHOLD),
        None,
    )
    if strongest_duplicate:
        complaint.duplicate_of_id = strongest_duplicate[0].id

    existing_targets = {
        row.target_complaint_id
        for row in db.query(ComplaintRelation.target_complaint_id)
        .filter(ComplaintRelation.source_complaint_id == complaint.id)
        .all()
    }

    for candidate, score in ranked:
        if candidate.id in existing_targets:
            continue
        relation_type = "DUPLICATE" if score >= DUPLICATE_THRESHOLD else "RELATED"
        db.add(
            ComplaintRelation(
                source_complaint_id=complaint.id,
                target_complaint_id=candidate.id,
                relation_type=relation_type,
                similarity_score=score,
                explanation=f"shared complaint terms; lexical similarity {score:.2f}",
            )
        )
