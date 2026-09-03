from app.models import Complaint, Priority


def apply_priority(complaint: Complaint, text_tokens: set[str]) -> None:
    urgent_terms = {"unsafe", "harassment", "threat", "medical", "violence", "fire"}
    high_terms = {"exam", "water", "electricity", "broken", "fee", "urgent"}
    reasons = []
    score = 0

    if text_tokens & urgent_terms:
        score += 3
        reasons.append("safety or immediate-risk terms detected")
    elif text_tokens & high_terms:
        score += 2
        reasons.append("service disruption terms detected")

    if complaint.affected_users >= 50:
        score += 2
        reasons.append(f"reported impact: {complaint.affected_users} people")
    elif complaint.affected_users >= 10:
        score += 1
        reasons.append(f"reported impact: {complaint.affected_users} people")

    complaint.priority = (
        Priority.urgent.value
        if score >= 3
        else Priority.high.value
        if score >= 2
        else Priority.normal.value
    )
    complaint.priority_reasons = reasons or ["routine impact based on submitted information"]
