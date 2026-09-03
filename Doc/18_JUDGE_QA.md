# Judge Questions and Strong Answers

## How does this project relate to MSC02 and SMA03? Are you solving two problem statements or one?

We identified that SMA03 and MSC02 represent two consecutive stages of the same institutional workflow. SMA03 handles intelligent intake, classification, and routing of incoming information; MSC02 consumes that structured grievance information to categorize it, assess urgency and impact, and prioritize institutional complaints. Rather than building two disconnected applications, we built one unified grievance intelligence platform, centered on MSC02, with SMA03 as its intake layer. See `PS_TRACEABILITY_MATRIX.md` for the exact capability-to-requirement mapping.

## What's the core value proposition?

MSC02's question: *"Which grievances require attention first, and why?"* SMA03 answers a prerequisite question: *"What is this incoming information, and where should it go?"* Together: what is the issue, how important is it, where should it go, how quickly should it be handled, and did the institution actually resolve it.

## Why do you need AI?

AI is useful because complaints are unstructured. Our LLM-first pipeline (using HuggingFace) classifies the unstructured text into 11 precise departments and categorizes the issue. This semantic understanding converts free text into structured operational signals. We deliberately keep policy, permissions, and final accountability outside the model.

## How do you detect duplicates?

We use a combination of lexical token overlap (Jaccard) and sequence matching. If similarity is ≥ 0.75, it's marked as an exact duplicate. If similarity is ≥ 0.40, we group the complaints into a shared "Problem Group". This prevents redundant workloads while preserving individual student records.

## What if the AI model goes down or is slow?

We built a resilient pipeline. The LLM has an 8-second hard timeout. If it times out or returns a 503 (model cold-start), the system instantly falls back to a deterministic keyword-based classifier using predefined Department Policies. The user experience is never blocked.

## What if AI is wrong?

Authorized staff can override classification or routing, and the override becomes an auditable event. The fallback classifier also ensures that edge cases not understood by the LLM are routed based on institutional policy keywords.

## Why not just use one database table?

The central registry of individual complaints is the source of truth, while department queues operate on grouped "Problem Groups" (`problem_groups` table). This gives departments clean, consolidated workspaces without losing the individual history and feedback loops of the student.

## How is priority calculated?

We calculate a deterministic Priority Score (0-100) based on:
- **Urgency (55%):** Driven by the LLM-assessed priority (Low, Normal, High, Urgent) and SLA deadlines.
- **Impact (45%):** Driven by the proportion of affected users relative to a predefined threshold.
The dashboard sorts the problem groups dynamically by this Priority Score.

## What if ten students report the same problem?

We cluster related complaints into a single Problem Group (threshold ≥ 0.40 similarity). We preserve each individual complaint, increase the `affected_users` count (which boosts the Impact Score), and give the department a consolidated operational view. When the department resolves the problem group, the solution propagates to all ten students automatically.

## What happens if a department does nothing?

The SLA engine (a background worker polling at `SLA_CHECK_INTERVAL_SECONDS`) detects due-soon and breached states, notifies the responsible authority, escalates according to policy, and records the event in the audit log.

## Can departments manipulate priority?

Priority changes should be permission-controlled and require a reason. AI and policy scores remain in history.

## What happens if a student disagrees with the resolution?

The student can reject the resolution and request reopening. The old resolution remains in history, the individual complaint returns to `in_progress`, and the parent Problem Group becomes active again.

## Is this replacing department staff?

No. It removes administrative friction (duplicate tickets, manual routing) and gives staff better prioritization, context, and accountability through the Central Thought dashboard.

## Can it scale?

Yes. The logical architecture starts as a modular monolith with PostgreSQL and a Redis polling worker for SLAs. High-load components like the HuggingFace LLM inference are externalized, and the background workers can be scaled horizontally.

## What is the real innovation?

The differentiator is the closed-loop orchestration: **understand → consolidate → prioritize → route → enforce SLA → resolve → validate → learn**. Most basic grievance systems stop at submission and status tracking.
