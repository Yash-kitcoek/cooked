# Core Problem / Department Dashboard Backend

This backend change introduces a department-facing `ProblemGroup` (core problem).
Students still create individual `Complaint` rows. Each complaint points to one
`ProblemGroup` through `complaints.problem_group_id`.

## Flow

1. Student submits only `title` and `description` to `POST /complaints`.
2. Existing classifier/pipeline determines department/category/priority.
3. The grouping service finds the best existing core problem in that department.
4. If similarity is below the threshold, a new core problem is created.
5. The complaint is attached to that group.
6. `affected_users` is recalculated as `COUNT(DISTINCT complaints.student_id)`.
7. Department dashboard reads groups, not individual complaint cards.
8. Department can open one group and see all affected students + source complaints.
9. `PUT /staff/problems/{problem_id}/solution` writes one solution to the group and
   propagates it to every active complaint in that group, plus creates an in-app
   notification for each complaint holder.

## New endpoints

- `GET /staff/problems?priority=high&status=open`
  - Department staff/head: only their department.
  - Admin: all departments.
  - Returns one row per core problem.

- `GET /staff/problems/{problem_id}`
  - Returns the core problem, distinct affected students, and its complaints.

- `PUT /staff/problems/{problem_id}/solution`
  - Body: `{ "solution": "..." }`
  - Resolves the common problem and propagates the answer to every member complaint.

## Database

`problem_groups` is added and `complaints.problem_group_id` is added as a nullable
foreign key. The migration is `0007_core_problem_groups`.

Existing complaints receive temporary one-complaint legacy groups during migration.
New complaints use intelligent grouping. The deterministic matcher is isolated in
`app/services/problem_grouping.py` so it can later be replaced by pgvector/LLM
semantic similarity without changing the API contract.

## Important

The active Docker backend in this repository is `v02/api/api` (the root
`v02/api/app` directory contains older/incomplete patch files). The compose file
`v02/docker-compose.yml` builds `./api/api`.
