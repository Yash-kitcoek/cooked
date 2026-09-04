from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List
from uuid import UUID

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Complaint, ComplaintStatus, ProblemGroup, ensure_utc, utcnow

logger = logging.getLogger(__name__)

BRIEF_PROMPT_TEMPLATE = """<|im_start|>system
You are an operational incident intelligence assistant for campus facility staff and administrators.
Analyze the provided grievance cluster and write an executive staff action brief in exactly ONE concise paragraph (2 to 4 sentences).
Strict guidelines:
- State what the likely core issue and root cause is based strictly on the complaint records.
- Note the specific location and the number of affected students.
- Mention historical precedent and how it was previously resolved, if provided.
- Maintain an objective, factual, operational tone. Do NOT speculate or add facts not present in the complaints.
- Do NOT output bullet points, greetings, or markdown code blocks. Output the single paragraph only.
<|im_end|>
<|im_start|>user
Current Incident Cluster:
- Department: {department}
- Category: {category}
- Specific Location: {location}
- Complaints in Cluster: {complaint_count}
- Affected Students: {affected_users}
- Title / Summary: {title}

Sample Student Complaints (up to 15):
{sample_complaints}

Historical Precedents (Past Resolved Issues in Same Department/Category):
{historical_precedents}

Write the staff action brief in exactly one paragraph (2 to 4 sentences):
<|im_end|>
<|im_start|>assistant
"""


def _sample_complaints(complaints: List[Complaint], max_sample: int = 15) -> str:
    lines = []
    for idx, c in enumerate(complaints[:max_sample], 1):
        desc = (c.description or "").strip()
        if len(desc) > 160:
            desc = desc[:157] + "..."
        lines.append(f"{idx}. [{c.title}] {desc}")
    return "\n".join(lines) if lines else "No detailed complaints recorded."


def _get_historical_precedents(db: Session, group: ProblemGroup, limit: int = 2) -> str:
    """Find past resolved problem groups in the same department/category with a solution."""
    query = (
        db.query(ProblemGroup)
        .filter(
            ProblemGroup.id != group.id,
            ProblemGroup.department == group.department,
            ProblemGroup.status.in_([ComplaintStatus.resolved.value, ComplaintStatus.closed.value]),
            ProblemGroup.solution_text.isnot(None),
        )
        .order_by(ProblemGroup.solution_at.desc(), ProblemGroup.updated_at.desc())
    )

    # If the group has a specific category, prefer matching category first
    category = group.category
    resolved_groups = query.limit(limit).all()
    if not resolved_groups and category:
        # Fall back to checking resolved individual complaints with solutions
        complaint_query = (
            db.query(Complaint)
            .filter(
                Complaint.department == group.department,
                Complaint.category == category,
                Complaint.status.in_([ComplaintStatus.resolved.value, ComplaintStatus.closed.value]),
                Complaint.solution_text.isnot(None),
            )
            .order_by(Complaint.solution_at.desc())
            .limit(limit)
        )
        complaints = complaint_query.all()
        if complaints:
            return "\n".join(
                f"- Past complaint '{c.title}': resolved with '{c.solution_text[:120]}'"
                for c in complaints
            )

    if resolved_groups:
        lines = []
        for rg in resolved_groups:
            sol = (rg.solution_text or "").strip()
            if len(sol) > 140:
                sol = sol[:137] + "..."
            lines.append(f"- Past cluster '{rg.title}' ({rg.location}): resolved via '{sol}'")
        return "\n".join(lines)

    return "No prior resolved precedents on record for this specific department issue."


def _fallback_deterministic_brief(
    group: ProblemGroup,
    complaint_count: int,
    affected_users: int,
    category: str,
    location: str,
    precedents_text: str,
) -> str:
    """Category-aware deterministic fallback when HF API is not configured or times out."""
    # Category-specific recommended actions
    _CATEGORY_ACTIONS: dict[str, str] = {
        # Water / Plumbing
        "water supply": "Dispatch plumbing personnel to inspect main supply valves and overhead tanks immediately.",
        "plumbing": "Arrange a plumbing inspection focusing on pipe joints, valves, and drainage outlets.",
        "sewage": "Issue a temporary-use advisory and escalate to the civil maintenance team for urgent drain inspection.",
        "drainage": "Coordinate with civil maintenance to clear blocked drains and assess overflow risk.",
        # Electrical
        "electrical": "Engage the electrical maintenance team to inspect the distribution board and circuit breakers.",
        "power": "Contact the electrical department to check the feeder lines and backup generator availability.",
        "lighting": "Raise a work order with electrical maintenance to replace fittings and check the circuit load.",
        # Network / IT
        "wi-fi": "Contact IT support to reboot the access point and verify switch port connectivity.",
        "wifi": "Raise a network outage ticket with IT; verify router firmware and uplink status.",
        "internet": "Escalate to the IT/network team to inspect the router, switches, and ISP link status.",
        "network": "IT team should perform a line-of-sight check, switch diagnostics, and cable inspection.",
        # Structural / Infrastructure
        "window": "Assign the civil works team to assess structural integrity and arrange glass/mesh replacement.",
        "door": "Civil maintenance team to inspect and repair hinges, locks, or frame damage.",
        "roof": "Arrange structural inspection for water ingress or load-bearing concerns.",
        "ceiling": "Civil team to investigate ceiling integrity and arrange repairs before further deterioration.",
        "wall": "Civil maintenance to inspect for cracks or seepage and initiate patching work.",
        # Sanitation / Hygiene
        "sanitation": "Notify housekeeping management to increase cleaning frequency and conduct hygiene inspection.",
        "hygiene": "Deploy additional housekeeping resources and conduct a formal sanitation audit of the block.",
        "washroom": "Escalate to housekeeping supervisors for immediate deep-clean and plumbing check.",
        "toilet": "Assign plumbing and housekeeping teams to assess blockages and restore working condition.",
        # Food / Mess
        "food": "Inform the mess/canteen management committee and conduct a quality audit immediately.",
        "mess": "Escalate to hostel/mess administration; conduct a food quality and quantity compliance check.",
        "canteen": "Raise with canteen management and hostel warden for corrective action and vendor review.",
        # Furniture / Equipment
        "furniture": "Submit a repair/replacement request to the stores and maintenance department.",
        "equipment": "Log a maintenance work order and assess whether temporary alternatives can be arranged.",
        "broken": "Coordinate with maintenance to assess repair vs. replacement and set a resolution timeline.",
        # Safety / Security
        "security": "Inform the security officer on duty and the warden; review CCTV coverage in the area.",
        "fire": "Immediately notify the fire safety officer and inspect fire suppression equipment in the block.",
        "safety": "Conduct a safety walkthrough with the warden and escalate to the facilities safety committee.",
        # Academic
        "lab": "Coordinate with the laboratory technician and department head for equipment repair or substitution.",
        "library": "Notify the librarian and IT support to restore resources and review access restrictions.",
        "projector": "IT/AV support to inspect and replace the projector or arrange an alternate classroom.",
        "classroom": "Facilities team to inspect the room and arrange alternative academic space if needed.",
        # Transport
        "bus": "Contact the transport coordinator and arrange alternative conveyance until the issue is resolved.",
        "transport": "Escalate to the transport office for route rescheduling and driver briefing.",
        # Medical
        "medical": "Notify the campus health center and arrange access to first-aid or medical assistance.",
        "health": "Coordinate with the campus health center and ensure students have access to care.",
    }

    # Match category to action (case-insensitive substring matching)
    cat_lower = (category or "").lower()
    matched_action = None
    for keyword, action in _CATEGORY_ACTIONS.items():
        if keyword in cat_lower:
            matched_action = action
            break

    # Also check title for keywords if category didn't match
    if not matched_action:
        title_lower = (group.title or "").lower()
        for keyword, action in _CATEGORY_ACTIONS.items():
            if keyword in title_lower:
                matched_action = action
                break

    if not matched_action:
        matched_action = "Assign a technical team for on-site inspection and confirm a resolution timeline with affected students."

    # Historical precedent sentence
    precedent_sentence = ""
    if precedents_text and "No prior resolved precedents" not in precedents_text:
        first_p = precedents_text.splitlines()[0].lstrip("- ")
        precedent_sentence = f" Precedent on record: {first_p}."

    return (
        f"Incident cluster in {location} involves {complaint_count} reported complaints "
        f"regarding {category}, affecting an estimated {affected_users} students "
        f"related to '{group.title}'.{precedent_sentence} "
        f"Recommended action: {matched_action}"
    )


def call_hf_for_brief(prompt: str) -> str | None:
    """Send structured prompt to HuggingFace Inference API with strict timeout and error recovery."""
    if not settings.hf_token or not settings.hf_model:
        logger.info("HF_TOKEN or HF_MODEL not configured. Using deterministic action brief.")
        return None

    url = f"https://api-inference.huggingface.co/models/{settings.hf_model}"
    headers = {
        "Authorization": f"Bearer {settings.hf_token}",
        "Content-Type": "application/json",
    }
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 200,
            "return_full_text": False,
            "temperature": 0.2,
            "top_p": 0.9,
        },
    }

    try:
        with httpx.Client(timeout=9.0) as client:
            response = client.post(url, headers=headers, json=payload)
            if response.status_code == 503:
                logger.warning("HF API 503 (model loading). Falling back gracefully.")
                return None
            response.raise_for_status()
            data = response.json()

            if isinstance(data, list) and len(data) > 0:
                text = data[0].get("generated_text", "")
            elif isinstance(data, dict):
                text = data.get("generated_text", "")
            else:
                text = str(data)

            cleaned = text.strip()
            # Strip any markdown backticks if returned
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            return cleaned if len(cleaned) > 20 else None
    except Exception as exc:
        logger.warning("HuggingFace API brief generation call failed (%s). Falling back gracefully.", exc)
        return None


def generate_cluster_brief(
    problem_id: UUID,
    db: Session,
    force: bool = False,
) -> str | None:
    """Generate or retrieve a cached AI action brief for the given cluster."""
    group = db.query(ProblemGroup).filter(ProblemGroup.id == problem_id).first()
    if not group:
        return None

    complaints = [c for c in group.complaints if c.deleted_at is None]
    complaint_count = len(complaints) if complaints else group.complaint_count
    affected_users = group.affected_users or (len(set(c.student_id for c in complaints)) if complaints else 1)
    category = group.category or "General"
    location = group.location or group.department or "Campus"

    # Check cache freshness: if brief exists and no new complaint was added since generation
    if not force and group.generated_brief and group.generated_brief_at:
        brief_at = ensure_utc(group.generated_brief_at)
        has_newer = any(
            ensure_utc(c.created_at) > brief_at
            for c in complaints
            if c.created_at and brief_at
        )
        if not has_newer:
            return group.generated_brief

    # Sample up to 15 complaints
    sample_text = _sample_complaints(complaints, max_sample=15)
    precedents_text = _get_historical_precedents(db, group, limit=2)

    prompt = BRIEF_PROMPT_TEMPLATE.format(
        department=group.department,
        category=category,
        location=location,
        complaint_count=complaint_count,
        affected_users=affected_users,
        title=group.title,
        sample_complaints=sample_text,
        historical_precedents=precedents_text,
    )

    # Attempt LLM call
    generated_text = call_hf_for_brief(prompt)

    # If LLM returned valid response, use it; otherwise use deterministic fallback
    brief = generated_text or _fallback_deterministic_brief(
        group=group,
        complaint_count=complaint_count,
        affected_users=affected_users,
        category=category,
        location=location,
        precedents_text=precedents_text,
    )

    # Cache on cluster record
    group.generated_brief = brief
    group.generated_brief_at = utcnow()
    db.commit()
    db.refresh(group)

    return brief
