"""
GET /public/stats — Public Accountability / Transparency Dashboard endpoint.

██████████████████████  PRIVACY FENCE  ██████████████████████
THIS ENDPOINT IS PUBLIC (no authentication required).

It MUST NEVER return:
  - complaint titles, descriptions, or any free-text field
  - student_id, email, username, PRN, division, roll_no, or any user identifier
  - staff names, solution_by_id, assigned_to_id, or any personnel field
  - storage_path, attachment URLs, or any complaint / problem-group UUID
  - any field that could identify an individual complaint or complainant

Only aggregate counts, averages, rates, and department/category labels
may ever be added to this response. If you are tempted to add a new field,
ask yourself: "could this help someone identify who filed a complaint or
what it said?" If yes, it must NOT be added here.
██████████████████████████████████████████████████████████████
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Complaint, ComplaintStatus, utcnow
from app.schemas import (
    DeptStatsOut,
    OverallStatsOut,
    PublicStatsOut,
    TrendingCategoryOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/public", tags=["public"])

_REDIS_KEY = "public:stats"
_CACHE_TTL = 300  # seconds — 5-minute TTL; adjust via future config field if needed

# Statuses that count as "resolved" for the public view
_RESOLVED = {ComplaintStatus.resolved.value, ComplaintStatus.closed.value}
# Statuses that count as "open / active" for SLA breach tracking
_ACTIVE = {ComplaintStatus.open.value, ComplaintStatus.in_progress.value, ComplaintStatus.escalated.value}


def _get_redis():
    """Return a Redis client or None if Redis is unavailable."""
    try:
        import redis as _redis
        from app.config import settings
        client = _redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=1)
        client.ping()
        return client
    except Exception:
        return None


def _compute_stats(db: Session) -> PublicStatsOut:
    """Run aggregate queries and assemble the public stats payload.

    All queries use aggregation or lightweight timestamp tuples — raw complaint
    text and user rows are NEVER loaded.
    """
    from app.main import DEPARTMENTS
    from app.models import ensure_utc

    now = utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    # ── 1. Department open/resolved counts ─────────────────────────────────────
    dept_rows = (
        db.query(
            Complaint.department,
            func.sum(
                case((Complaint.status.in_(list(_ACTIVE)), 1), else_=0)
            ).label("open_count"),
            func.sum(
                case((Complaint.status.in_(list(_RESOLVED)), 1), else_=0)
            ).label("resolved_count"),
        )
        .filter(Complaint.deleted_at.is_(None))
        .group_by(Complaint.department)
        .all()
    )

    dept_counts: dict[str, dict[str, int]] = {}
    for r in dept_rows:
        dept_counts[r.department] = {
            "open": int(r.open_count or 0),
            "resolved": int(r.resolved_count or 0),
        }

    # ── 2. SLA breach check (active complaints past sla_due_at) ───────────────
    active_slas = (
        db.query(Complaint.department, Complaint.sla_due_at)
        .filter(
            Complaint.deleted_at.is_(None),
            Complaint.status.in_(list(_ACTIVE)),
            Complaint.sla_due_at.isnot(None),
        )
        .all()
    )
    breach_by_dept: dict[str, int] = {}
    for dept, due_at in active_slas:
        due_utc = ensure_utc(due_at)
        if due_utc and due_utc < now:
            breach_by_dept[dept] = breach_by_dept.get(dept, 0) + 1

    # ── 3. Resolution times (clean cross-engine python calculation) ───────────
    resolved_times = (
        db.query(Complaint.department, Complaint.solution_at, Complaint.created_at)
        .filter(
            Complaint.deleted_at.is_(None),
            Complaint.status.in_(list(_RESOLVED)),
            Complaint.solution_at.isnot(None),
            Complaint.created_at.isnot(None),
        )
        .all()
    )

    dept_res_hours: dict[str, list[float]] = {}
    all_res_hours: list[float] = []
    total_resolved_month = 0

    for dept, sol_at, cr_at in resolved_times:
        sol_utc = ensure_utc(sol_at)
        cr_utc = ensure_utc(cr_at)
        if sol_utc and cr_utc:
            diff_hours = max((sol_utc - cr_utc).total_seconds() / 3600.0, 0.0)
            dept_res_hours.setdefault(dept, []).append(diff_hours)
            all_res_hours.append(diff_hours)
            if sol_utc >= month_start:
                total_resolved_month += 1

    # ── 4. Build department stats list ────────────────────────────────────────
    # Gather all departments present in data, and ensure standard DEPARTMENTS are included
    all_dept_names = sorted(set(list(dept_counts.keys()) + [d for d in DEPARTMENTS if d != "General Review"]))
    departments: list[DeptStatsOut] = []
    total_open = 0

    for dept_name in all_dept_names:
        counts = dept_counts.get(dept_name, {"open": 0, "resolved": 0})
        open_c = counts["open"]
        resolved_c = counts["resolved"]
        breach_c = breach_by_dept.get(dept_name, 0)
        sla_breach_rate = round(breach_c / open_c, 4) if open_c > 0 else 0.0

        hours_list = dept_res_hours.get(dept_name, [])
        avg_h = round(sum(hours_list) / len(hours_list), 2) if hours_list else None

        departments.append(
            DeptStatsOut(
                name=dept_name,
                open_count=open_c,
                resolved_count=resolved_c,
                avg_resolution_hours=avg_h,
                sla_breach_rate=sla_breach_rate,
            )
        )
        total_open += open_c

    # ── 5. Overall stats ──────────────────────────────────────────────────────
    global_avg_h = round(sum(all_res_hours) / len(all_res_hours), 2) if all_res_hours else None

    overall = OverallStatsOut(
        total_open=total_open,
        total_resolved_this_month=total_resolved_month,
        avg_resolution_hours=global_avg_h,
    )

    # ── 6. Trending categories (last 7 days) ──────────────────────────────────
    trending_rows = (
        db.query(
            Complaint.category,
            func.count(Complaint.id).label("cnt"),
        )
        .filter(
            Complaint.deleted_at.is_(None),
            Complaint.created_at >= week_ago,
        )
        .group_by(Complaint.category)
        .order_by(func.count(Complaint.id).desc())
        .limit(10)
        .all()
    )
    trending: list[TrendingCategoryOut] = [
        TrendingCategoryOut(category=r.category, count_last_7_days=int(r.cnt))
        for r in trending_rows
        if r.category
    ]

    return PublicStatsOut(
        departments=departments,
        trending_categories=trending,
        overall=overall,
        last_updated=now,
    )


@router.get(
    "/stats",
    response_model=PublicStatsOut,
    summary="Public accountability dashboard — no authentication required",
)
def public_stats(db: Session = Depends(get_db)) -> PublicStatsOut:
    """Return aggregated complaint statistics for public transparency.

    No authentication is required. This endpoint ONLY returns counts,
    averages, rates, and category/department labels — never any personally
    identifiable or sensitive complaint data.

    Responses are cached in Redis for up to 5 minutes to keep DB load low.
    The cache degrades gracefully: if Redis is unavailable, stats are
    computed fresh from Postgres on every request.
    """
    redis_client = _get_redis()

    # ── Cache read ────────────────────────────────────────────────────────────
    if redis_client:
        try:
            cached = redis_client.get(_REDIS_KEY)
            if cached:
                return PublicStatsOut.model_validate_json(cached)
        except Exception as exc:
            logger.warning("Redis read failed for public stats: %s", exc)

    # ── Compute ───────────────────────────────────────────────────────────────
    stats = _compute_stats(db)

    # ── Cache write ───────────────────────────────────────────────────────────
    if redis_client:
        try:
            redis_client.setex(_REDIS_KEY, _CACHE_TTL, stats.model_dump_json())
        except Exception as exc:
            logger.warning("Redis write failed for public stats: %s", exc)

    return stats
