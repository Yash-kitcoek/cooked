import hashlib
import json

from fastapi import HTTPException, Request, status
from sqlalchemy.orm import Session

from app.models import IdempotencyKey, User


async def request_hash(request: Request) -> str:
    body = await request.body()
    return hashlib.sha256(body).hexdigest()


def get_existing(db: Session, user: User, key: str, method: str, path: str, body_hash: str) -> IdempotencyKey | None:
    existing = (
        db.query(IdempotencyKey)
        .filter_by(user_id=user.id, key=key, method=method, path=path)
        .one_or_none()
    )
    if existing and existing.request_hash != body_hash:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="idempotency key reused with different request")
    return existing


def store_response(db: Session, user: User, key: str, method: str, path: str, body_hash: str, response: dict, status_code: int) -> None:
    db.add(
        IdempotencyKey(
            user_id=user.id,
            key=key,
            method=method,
            path=path,
            request_hash=body_hash,
            response_json=json.loads(json.dumps(response, default=str)),
            status_code=status_code,
        )
    )
