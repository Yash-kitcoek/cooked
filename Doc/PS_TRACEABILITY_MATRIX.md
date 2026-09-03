# PS Traceability Matrix

## Positioning

This platform is built around **one primary problem statement**, with a second problem statement integrated as an upstream capability — not as a second product.

- **MSC02 (core):** "Develop an AI-based system that categorizes institutional complaints and prioritizes them according to urgency and impact."
- **SMA03 (integrated intake capability):** "Develop a system that automatically classifies incoming documents and routes them to appropriate departments."

SMA03 is implemented as the **intelligent intake, classification, and routing layer** that feeds structured, canonical grievance data into the MSC02 prioritization pipeline. There is one platform, one data model, one lifecycle — not two systems bolted together.

## Traceability matrix

| Requirement | PS | System Capability | Architecture Component | Demo Evidence |
|---|---|---|---|---|
| Categorize institutional complaints | MSC02 | AI Complaint Classification (HuggingFace LLM with heuristic fallback) | Intake Layer — `services/intelligent_intake.py` and `services/llm.py` | Complaint routed to correct department (e.g., Hostel/Water Supply) |
| Assess urgency | MSC02 | Urgency sub-score (derived from SLA proximity, complaint velocity, and LLM priority label) | Grouping Engine — `services/problem_grouping.py` | Dashboard shows priority score driven 55% by Urgency |
| Assess impact | MSC02 | Impact sub-score (driven by number of affected users joined to the Problem Group) | Grouping Engine — `services/problem_grouping.py` | Priority score increases as multiple students report the same issue |
| Prioritize complaints | MSC02 | Weighted Priority Score (0–100) driving the staff dashboard | Grouping Engine — `services/problem_grouping.py` | Staff dashboard sorted dynamically by priority score |
| Detect duplicate/related complaints | MSC02 | Lexical token similarity + sequence matching (≥0.75 dup, ≥0.40 group) | Duplicate Engine — `pipeline/duplicate_detector.py` | Second complaint linked into existing cluster automatically |
| Intelligent grievance processing (end-to-end) | MSC02 | Central Orchestrator + state machine | Orchestrator — `pipeline/orchestrator.py` | Full lifecycle demo, submission → group resolution → student validation |
| Actionable prioritized complaint management | MSC02 | Department dashboard grouped by core problems, sorted by priority | UI — `web/src/pages/DepartmentQueue.jsx` | Dashboard screenshot/live view |
| Classify incoming documents/content | SMA03 | Content classification on web text (and API inputs) | Intake Adapter Layer | Complaint automatically categorized based purely on description text |
| Route to appropriate department | SMA03 | Routing Engine consuming classification output to select from 11 departments | Pipeline — `pipeline/classifier.py` | Complaint appears in correct department queue automatically |
| Multi-channel intake | SMA03 | Web / API adapters normalizing to one canonical object | API Routes — `api/routes/complaints.py` | Intake pipeline processes both direct web form and simulated API requests |
| Institutional grievance lifecycle after routing | MSC02 | SLA escalation, resolution propagation, analytics | Worker — `workers/sla_tasks.py` | Background worker escalating overdue items |

## How SMA03 and MSC02 connect (traceable example)

```text
Incoming Web Form / API Request
  → SMA03: Intake extracts raw text
  → SMA03: HuggingFace LLM Classification → "Hostel / Water Supply"
  → SMA03: Routing decision → Hostel Department
  → MSC02: Duplicate/related check against existing complaints (Problem Group merge)
  → MSC02: Urgency + Impact assessment (Affected Users count increments)
  → MSC02: Priority score calculated
  → MSC02: Appears in Hostel queue, SLA clock starts
  → MSC02: Escalation if breached (Redis background worker)
  → MSC02: Resolution → Student validation (Propagated to all affected students)
```

Every capability that exists because of SMA03 (initial classification, routing) has a single, traceable purpose: producing a canonical input that MSC02's prioritization pipeline consumes. No SMA03 capability exists as a standalone feature disconnected from the MSC02 workflow.
