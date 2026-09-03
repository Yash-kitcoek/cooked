# Hackathon Demo Script

## Opening — 30 seconds

"Students can submit complaints today. The harder problem is what happens after submission: duplicate reports, wrong routing, unclear urgency, departmental silos, delayed action, and no reliable feedback loop. Our platform turns a complaint into an accountable workflow."

Demo disclosure: this revision demonstrates JWT/RBAC, PostgreSQL persistence, web/API intake, HuggingFace LLM categorization with heuristic fallback, lexical duplicate detection, SLA escalation, and persisted notifications. Do not claim OCR or inbound email mailbox automation.

## Demo 1 — Student Intake & Similarity Suggestions

Show:
- login;
- dashboard;
- previous and pending complaints;
- new complaint form.

Narration:
"The student does not need to know the internal institutional hierarchy. They simply describe the problem. As they type, the system searches for similar active problems to prevent duplicate tickets."

## Demo 2 — Joining an Existing Problem

Submit:
> "There has been no water in Hostel Block A since 8 AM and around 80 students are affected."

Show:
- Similarity suggestions populate with an existing water issue.
- The student clicks "I Have This Problem Too" (Join Problem).

Narration:
"Instead of creating a new isolated workload for the department, the student joins the existing problem. The student gets their own personal ticket to track, but the department only sees one unified problem, with the 'affected users' count incremented. This accurately measures impact."

## Demo 3 — Intelligence & Prioritization (New Complaint)

Submit a new, distinct complaint and click "This is different — Continue Creating New Complaint" (`force_new=true`).

Show:
- HuggingFace LLM Classification (Hostel / Water Supply)
- Priority calculation based on Urgency and Impact.

Narration:
"When a genuinely new issue is reported, the AI pipeline extracts the correct department and category. The system then calculates a Priority Score based on 55% urgency factors and 45% impact (affected users). The AI does not simply label text — it extracts operational signals that influence urgency."

## Demo 4 — Routing (API-backed demo queue)

Show the Hostel department dashboard (ProblemGroup Central Thought UI).

Narration:
"Staff don't see 50 identical tickets. They see consolidated Problem Groups, automatically sorted by the AI-calculated Priority Score. The same architecture works for Exam Cell, Academics, and 8 other departments."

## Demo 5 — Accountability (SLA Engine)

The worker checks overdue complaints at `SLA_CHECK_INTERVAL_SECONDS`; `POST /admin/sla-check` demonstrates it immediately.

Show:
- assigned staff;
- SLA deadline;
- escalation state.

Narration:
"Prioritization only matters if it changes operational behavior. Our SLA engine makes overdue work visible, escalates it automatically, and notifies the relevant stakeholders."

## Demo 6 — Resolution Propagation

Resolve the grouped problem from the department dashboard (`PUT /staff/problems/{id}/solution`).

Show:
- resolution;
- student notification (for all affected students in the group);
- validation (student can accept/reject);
- archive/history.

Narration:
"When staff resolve the core problem, the solution propagates to every student who reported it. The students get notified and can individually validate the resolution. The old resolution remains in history and the case can return to an active workflow if rejected."

## Closing — 30 seconds

"The output is not just a closed ticket. The institution now has a structured, auditable history of what students experience, how departments respond, where bottlenecks occur, and which problems repeat."
