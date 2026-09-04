# SIH-2026 v02 — Rebuilt Migration/Codebase Package

This package preserves the current application source and repairs the broken Alembic migration chain.

## What was repaired

The previous migration directory contained:
- a non-Python placeholder migration;
- a duplicate/root `problem_groups` migration;
- a `0006_suggestion_reviews` revision that referenced a missing `0005_messages` migration;
- a frontend-contract migration whose schema was not represented by the current SQLAlchemy models.

The rebuilt chain is now:

`0001_initial -> 0002_intelligence_lifecycle -> 0003_complaint_soft_delete -> 0004_student_profiles -> 0005_messages -> 0006_solution_feedback -> 0007_problem_groups`

The unused suggestion-review and frontend-contract migration files were removed because they did not correspond to the current application models/routes.

## First clean Docker run

If you are intentionally starting from a fresh development database, run:

```bash
docker compose down -v
docker compose up -d --build
```

**WARNING:** `docker compose down -v` deletes the local PostgreSQL volume and all data in it. Do not run it if you need the existing database.

Then verify:

```bash
docker compose ps
docker compose logs api --tail=100
curl http://localhost:8000/health/live
```

Expected health response is HTTP 200.

## Existing database

Do NOT delete the PostgreSQL volume. First inspect its migration state with:

```bash
docker compose exec postgres psql -U complaints -d complaints -c "SELECT * FROM alembic_version;"
```

If the existing database was created by the old broken migration graph, reconcile/stamp it only after checking which tables/columns already exist.

## Environment

The packaged `.env` files contain only local-development values. Replace `JWT_SECRET`, admin credentials, SMTP/OIDC settings, and other production secrets before deployment.

HF_TOKEN may be left empty. The application has deterministic fallbacks for the AI-assisted intake/briefing paths.
