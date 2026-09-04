from app.models import Complaint

TEMPLATES = {
    "Hostel": "Dispatch maintenance to {dept} within SLA window; notify affected students of ETA.",
    "Exam Cell": "Escalate to examination controller; verify hall ticket/result record before response.",
    "Academics": "Route to concerned faculty/HOD for clarification; log outcome in student record.",
    "CSE": "Assign to CSE lab technician or faculty for prompt review; track resolution via ticketing.",
    "AIML": "Route to AI/ML department coordinator; check resource availability and notify stakeholders.",
    "CSBS": "Assign to CSBS program lead; evaluate impact on coursework and resolve.",
    "Mechanical": "Dispatch mechanical workshop staff to inspect and address the reported issue.",
    "Electrical": "Escalate to electrical maintenance team; ensure safety protocols are followed.",
    "ENTC": "Route to ENTC lab assistant or faculty; test equipment and resolve.",
    "Biotech": "Assign to Biotech lab coordinator; ensure compliance with lab safety guidelines.",
    "Canteen": "Notify canteen manager and facility supervisor; address hygiene/service issue immediately.",
}

def suggest_resolution(complaint: Complaint) -> str:
    base = TEMPLATES.get(complaint.department, "Assign to department staff for manual review.").replace("{dept}", complaint.department or "department")
    if complaint.priority in ("high", "urgent"):
        base = f"URGENT — {base} Prioritize ahead of routine queue items."
    if complaint.priority_reasons:
        base += f" Context: {'; '.join(complaint.priority_reasons)}."
    return base
