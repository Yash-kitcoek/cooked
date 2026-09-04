# Problem Intelligence Frontend

Implemented for the existing staff workspace.

## Routes
- `/staff/problems`
- `/staff/problems/:id`
- `/staff/problems/:id/intelligence`

## Current backend compatibility
The intelligence page first requests:
`GET /staff/problems/{problem_id}/intelligence`

If that endpoint is not available yet, it automatically falls back to:
`GET /staff/problems/{problem_id}`

This means the page works now with the verified ProblemGroup backend and becomes AI-enriched automatically when the intelligence endpoint is added.

## Expected AI endpoint shape
The frontend accepts optional fields such as:
- `ai_analysis.executive_summary` / `summary` / `analysis`
- `ai_analysis.confidence` or `core_problem_confidence`
- `recommendations`
- `evidence.items`, `evidence.count`
- `evidence_analysis`
- `intelligence`

The Hugging Face API key must remain on the backend. Never put the HF key in Vite/React environment variables that are shipped to the browser.

## Important existing fix
The staff solution request now sends only the backend-supported payload:
`{"solution":"..."}`

It no longer sends an unsupported `status` field.
