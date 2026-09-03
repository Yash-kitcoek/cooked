# API Structure

The API keeps the public entrypoints stable while separating complaint intelligence from background work.

## Request flow

```text
app.main:app
  -> app.main route handlers
  -> app.pipeline.orchestrator.analyze_complaint
  -> database commit
  -> app.workers.queue enqueue_ai_processing
```

## Application packages

```text
app/
├── main.py                  # FastAPI app and current HTTP endpoints
├── core/                    # Settings, security, logging, constants
├── db/                      # Database session, metadata, and model namespaces
│   └── models/               # User, complaint, department, communication, audit
├── api/                     # HTTP dependency and route namespaces
│   └── routes/               # health, auth, users, profiles, complaints, intake, admin, etc.
├── schemas/                 # Domain schema namespaces
├── services/                # Business-service boundaries
├── integrations/            # SMTP and file-storage boundaries
├── pipeline/                # Synchronous complaint analysis
│   ├── orchestrator.py      # Runs pipeline stages in order
│   ├── policies.py          # Default department and SLA policies
│   ├── classifier.py        # Department/category/confidence
│   ├── priority.py          # Priority and priority reasons
│   └── duplicate_detector.py# Lexical related/duplicate detection
├── workers/                 # RQ jobs and external delivery
│   ├── queue.py             # Queue connection and dispatch
│   ├── ai_tasks.py          # Embedding and vector duplicate work
│   ├── sla_tasks.py         # SLA escalation
│   └── notifications.py     # SMTP delivery
├── models.py                # Current model implementation and compatibility source
├── schemas.py               # Current schema implementation and compatibility source
├── database.py              # Database session dependency
├── dependencies.py          # Authentication dependency
├── security.py              # JWT and password operations
├── rbac.py                  # Role and complaint access checks
└── audit.py                 # Audit event persistence
```

`intelligence.py` and `tasks.py` are compatibility facades. The new `core/`, `db/`, `schemas/`, `services/`, `integrations/`, and `api/routes/` modules are compatibility boundaries ready for incremental extraction. New code should import from those namespaces, `app.pipeline`, or `app.workers` directly. Existing imports and the `app.main:app` launch command remain valid.

The route implementations are still centralized in `main.py` for now. Move one endpoint group into its matching `api/routes/*.py` router when changing that area; do not duplicate an endpoint in both places.

## Pipeline stages

1. `policies.ensure_default_policies` makes sure classification policies exist.
2. `classifier.classify_complaint` selects department, category, confidence, and SLA.
3. `priority.apply_priority` calculates priority and explains the result.
4. `duplicate_detector.detect_duplicates` creates related or duplicate relations.
5. The API commits the complaint.
6. `workers.queue.enqueue_ai_processing` schedules embedding work.

The synchronous stages are deterministic and suitable for request-time validation. Embedding generation and SLA checks remain background operations.

## Commands

```text
uvicorn app.main:app --reload       # API
python -m app.worker                 # RQ worker and SLA ticker
pytest                               # API tests
```
