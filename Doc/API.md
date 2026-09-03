# REST API Contracts

This document outlines the live HTTP API endpoints provided by the FastAPI backend. There is no `/api/v1/` prefix in the deployed application; all routes are mounted directly at the root.

All protected endpoints require an `Authorization: Bearer <token>` header.

## 1. Authentication & Users

- `POST /auth/signup` (or `/auth/register`) — Create a new student account.
- `POST /auth/login` — Authenticate and receive a JWT.
- `GET /auth/me` — Retrieve the current authenticated user's profile and RBAC role.

## 2. Intake & Student Routes

### Complaints
- `POST /complaints` — Submit a new complaint. (Accepts `title` and `description` only. Optional `force_new: true` bypasses problem grouping).
- `GET /complaints` — List the authenticated student's complaint history.
- `GET /complaints/{id}` — Get full details of a specific complaint.
- `GET /complaints/{id}/timeline` — View the audit/lifecycle timeline for a complaint.
- `POST /complaints/{id}/feedback` — Submit student feedback (accept or reject) on a resolution.
- `POST /complaints/{id}/reopen` — Request to reopen a resolved complaint.

### Core Problems (Similarity & Discovery)
- `GET /problems` — List active real-world problems (ProblemGroups) for discovery.
- `GET /problems/{id}` — View details of a specific active problem.
- `GET /problems/similar?title=...&description=...` — Returns ranked active problem groups based on text similarity (used while typing).
- `POST /problems/{id}/report` — "I Have This Problem Too". Creates a student complaint linked to the existing problem group.

## 3. Staff & Department Routes

Staff endpoints enforce RBAC and automatically scope data to the staff member's assigned department.

- `GET /staff/dashboard` — High-level statistics for the department.
- `GET /staff/complaints` — Flat list of individual complaints in the department.
- `GET /staff/problems` — List ProblemGroups in the department, sorted dynamically by `priority_score`.
- `GET /staff/problems/{id}` — Detail view of a ProblemGroup, including all member complaints and the aggregated `affected_users` count.
- `PUT /staff/problems/{id}/solution` — Resolve a ProblemGroup. The backend propagates this solution to all member complaints and notifies the respective students.

## 4. Admin Routes

Admin endpoints provide institution-wide visibility across all departments.

- `GET /admin/dashboard` — Institution-wide metrics.
- `GET /admin/complaints` — Global list of all complaints.
- `GET /admin/staff` — List all staff accounts.
- `POST /admin/staff` — Provision a new staff account.
- `GET /admin/student-profiles` — List all registered students.
- `GET /admin/audit-logs` — Immutable audit trail of lifecycle events and overrides.

## 5. Health & Infrastructure

- `GET /health/live` — Liveness probe (returns `{"status":"ok"}`).
- `GET /health/ready` — Readiness probe (checks database connection).
