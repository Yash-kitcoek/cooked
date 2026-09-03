# SIH-2026 — Smart Complaint Prioritization System

This is a full-stack web application for a college/institution where **students** file grievances and **department staff** resolve them. The AI automatically:
- **Categorizes** each complaint into the right department and issue category
- **Public Problem Discovery:** Students can view existing problems and report their issues against them to avoid duplicates
- **Detects duplicates** and groups complaints about the same real-world problem
- **Prioritizes** the grouped problems by urgency and number of affected students
- **Notifies** students when their complaint is resolved and escalates overdue work (SLAs)

## 🚀 Quick Start (Docker)

**Prerequisites:** Docker Compose.

```bash
# 1. Setup environment variables
cp api/api/.env.example api/api/.env

# 2. Start all services (Postgres, Redis, API, Worker, Web)
docker compose up -d --build

# 3. Seed demo data (optional but recommended)
docker compose exec api python seed_staff.py           # Staff accounts
docker compose exec api python seed_demo_problems.py   # 3 Hostel problem groups
docker compose exec api python seed_demo_complaints.py # 58 dummy complaints
```

### Accessing the System
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **API Interactive Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

## 👤 Demo Accounts

| Username | Password | Role | Department |
|---|---|---|---|
| hostel_staff | staff@123 | staff | Hostel |
| cse_staff | staff@123 | staff | CSE |
| aiml_staff | staff@123 | staff | AIML |
| csbs_staff | staff@123 | staff | CSBS |
| mech_staff | staff@123 | staff | Mechanical |
| elec_staff | staff@123 | staff | Electrical |
| entc_staff | staff@123 | staff | ENTC |
| biotech_staff | staff@123 | staff | Biotech |
| exam_staff | staff@123 | staff | Exam Cell |
| canteen_staff | staff@123 | staff | Canteen |

**Admin:** Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `api/api/.env`.
**Students:** Register an account directly at `/signup`.

## 💻 Local Development (Without Docker)

### Backend (FastAPI)
```bash
cd api/api
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```
API runs on `http://localhost:8000`

### Frontend (React + Vite)
```bash
cd web
npm install
npm run dev
```
Web runs on `http://localhost:5173`

## ⚙️ Environment Variables (`api/api/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | YES | — | PostgreSQL connection string |
| `JWT_SECRET` | YES | — | Min 32 characters |
| `REDIS_URL` | no | `redis://localhost:6379/0` | Redis |
| `HF_TOKEN` | no | — | HuggingFace API token |
| `HF_MODEL` | no | — | HuggingFace model ID |
| `ADMIN_USERNAME` | no | `admin` | Auto-created admin |
| `ALLOWED_ORIGINS` | no | `http://localhost:5173,http://127.0.0.1:5173` | CORS allowed origins (comma-sep) |
| `MAX_UPLOAD_BYTES` | no | `5242880` | Max file size for attachments |
| `SLA_CHECK_INTERVAL_SECONDS` | no | `300` | Worker polling frequency |

## 📚 Documentation Index

Core documentation has been consolidated into the following key files:

- **[DEPLOYMENT.md](DEPLOYMENT.md):** Oracle Cloud VM + Caddy + sslip.io production setup.
- **[Doc/ARCHITECTURE.md](Doc/ARCHITECTURE.md):** System architecture, pipeline design, and component mapping.
- **[Doc/API.md](Doc/API.md):** Live REST API contracts for all roles.
- **[Doc/AI_PIPELINE.md](Doc/AI_PIPELINE.md):** How categorization, priority scoring, and duplicate detection work.
- **[Doc/DATA_MODEL.md](Doc/DATA_MODEL.md):** Database schema and entity relationships.
- **[Doc/17_DEMO_SCRIPT.md](Doc/17_DEMO_SCRIPT.md):** The end-to-end hackathon presentation script.
- **[Doc/18_JUDGE_QA.md](Doc/18_JUDGE_QA.md):** Questions and strong answers for SIH judges.
- **[Doc/PS_TRACEABILITY_MATRIX.md](Doc/PS_TRACEABILITY_MATRIX.md):** Mapping features to problem statements MSC02 and SMA03.

*(Note: Developer-specific docs for the backend package exist in `api/api/ARCHITECTURE.md` and `api/api/CORE_PROBLEM_BACKEND.md`)*
