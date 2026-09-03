#!/usr/bin/env python3
"""
End-to-end smoke test against a live GIOP Docker environment.

Run from project root:
    docker compose exec -T api python /app/verify_all.py

Or locally with the API exposed on port 8000:
    python api/api/verify_all.py
"""
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

BASE = "http://localhost:8000"


def req(method: str, path: str, body=None, token: str | None = None, expected_status: int = 200) -> dict:
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read().decode()
            status = resp.status
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        status = e.code

    if status != expected_status:
        print(f"  FAIL  {method} {path} → {status} (expected {expected_status})")
        print(f"         body: {raw[:300]}")
        return {}
    return json.loads(raw) if raw else {}


def login(username: str, password: str) -> str:
    data = req("POST", "/auth/login", {"username": username, "password": password})
    tok = data.get("access_token", "")
    if not tok:
        print(f"  FAIL  login as {username!r} returned no token")
        sys.exit(1)
    return tok


def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)


def check(label: str, condition: bool, detail: str = ""):
    status = "  PASS" if condition else "  FAIL"
    msg = f"{status}  {label}"
    if detail:
        msg += f"\n         → {detail}"
    print(msg)
    return condition


all_passed = True


section("1. Health checks")
h = req("GET", "/health/live")
all_passed &= check("/health/live → ok", h.get("status") == "ok")
h2 = req("GET", "/health/ready")
all_passed &= check("/health/ready → ready", h2.get("status") == "ready")


section("2. Department policies — 11 rows with correct SLA")
admin_tok = login("admin", "admin@123")
departments_data = req("GET", "/departments", token=admin_tok)
dept_names = {d["name"] for d in departments_data}
required = {"Hostel", "CSE", "AIML", "CSBS", "Mechanical", "Electrical", "ENTC", "Biotech", "Exam Cell", "Canteen", "General Review"}
missing = required - dept_names
all_passed &= check(f"All 11 departments present", not missing, f"Missing: {missing}" if missing else "")

# Register students to submit complaints
for username, email in [("stu1_verify", "stu1_verify@example.edu"), ("stu2_verify", "stu2_verify@example.edu")]:
    req("POST", "/auth/register", {"username": username, "email": email, "password": "TestPass123!"}, expected_status=201)

stu1_tok = login("stu1_verify", "TestPass123!")
stu2_tok = login("stu2_verify", "TestPass123!")


section("3. SLA — department-specific hours applied at creation")
c_elec = req("POST", "/complaints",
    {"title": "Power outage in lab", "description": "Electrical wiring fault in B101 causing sparks and short circuit."},
    token=stu1_tok, expected_status=201)
c_hostel = req("POST", "/complaints",
    {"title": "Water outage Hostel Block C", "description": "No water supply in hostel since this morning in Block C washroom."},
    token=stu1_tok, expected_status=201)

if c_elec and c_hostel:
    now = datetime.now(timezone.utc)
    if c_elec.get("sla_due_at"):
        sla_elec_dt = datetime.fromisoformat(c_elec["sla_due_at"].replace("Z", "+00:00"))
        hours_elec = (sla_elec_dt - now).total_seconds() / 3600
        all_passed &= check(
            f"Electrical SLA ≈ 12h (actual {hours_elec:.1f}h)",
            10 <= hours_elec <= 14,
            f"department={c_elec.get('department')}, sla_due_at={c_elec.get('sla_due_at')}"
        )
    if c_hostel.get("sla_due_at"):
        sla_hostel_dt = datetime.fromisoformat(c_hostel["sla_due_at"].replace("Z", "+00:00"))
        hours_hostel = (sla_hostel_dt - now).total_seconds() / 3600
        all_passed &= check(
            f"Hostel SLA ≈ 24h (actual {hours_hostel:.1f}h)",
            22 <= hours_hostel <= 26,
            f"department={c_hostel.get('department')}, sla_due_at={c_hostel.get('sla_due_at')}"
        )


section("4. /staff/problems — scores, students, complaints")
staff_tok = login("hostel_staff", "staff@123")
problems = req("GET", "/staff/problems", token=staff_tok)
all_passed &= check(f"GET /staff/problems → list ({len(problems)} groups)", isinstance(problems, list))

problems_hi = req("GET", "/staff/problems?priority=high", token=staff_tok)
all_passed &= check("GET /staff/problems?priority=high → 200", isinstance(problems_hi, list))

problems_q = req("GET", "/staff/problems?q=water", token=staff_tok)
all_passed &= check("GET /staff/problems?q=water → 200", isinstance(problems_q, list))

if problems:
    g = problems[0]
    gid = g["id"]
    all_passed &= check("category present", g.get("category") is not None, str(g.get("category")))
    all_passed &= check("urgency_score non-null", g.get("urgency_score") is not None, str(g.get("urgency_score")))
    all_passed &= check("impact_score non-null", g.get("impact_score") is not None, str(g.get("impact_score")))
    all_passed &= check("priority_score non-null", g.get("priority_score") is not None, str(g.get("priority_score")))

    detail = req("GET", f"/staff/problems/{gid}", token=staff_tok)
    all_passed &= check(f"GET /staff/problems/{{id}} → 200", bool(detail))
    if detail:
        all_passed &= check("detail.students is list", isinstance(detail.get("students"), list))
        all_passed &= check("detail.complaints is list", isinstance(detail.get("complaints"), list))


section("5. Duplicate detection — second similar complaint joins existing group")
stu3_reg = req("POST", "/auth/register", {"username": "stu3_verify", "email": "stu3_verify@example.edu", "password": "TestPass123!"}, expected_status=201)
stu3_tok = login("stu3_verify", "TestPass123!")

first_c = req("POST", "/complaints",
    {"title": "Hostel Block A water outage", "description": "No water supply in Hostel Block A since morning."},
    token=stu2_tok, expected_status=201)
second_c = req("POST", "/complaints",
    {"title": "No water in Hostel Block A", "description": "Hostel Block A water supply has been unavailable since morning."},
    token=stu3_tok, expected_status=201)

if first_c and second_c:
    same_group = first_c.get("problem_group_id") == second_c.get("problem_group_id")
    all_passed &= check(
        "Similar complaints → same ProblemGroup",
        same_group,
        f"first={first_c.get('problem_group_id')} second={second_c.get('problem_group_id')}"
    )
    all_passed &= check(
        "Second complaint affected_users == 2",
        second_c.get("affected_users") == 2,
        f"actual: {second_c.get('affected_users')}"
    )

    # GET /problems/similar
    similar = req("GET", f"/problems/similar?title=Hostel+water+outage+Block+A&description=No+water+Block+A&department=Hostel", token=stu3_tok)
    all_passed &= check("GET /problems/similar → returns ranked matches", len(similar) >= 1 if isinstance(similar, list) else False)


section("6. Group resolve — all member complaints flip to resolved + notifications")
# Find a hostel group from above
hostel_groups = req("GET", "/staff/problems", token=staff_tok)
hostel_group = next((g for g in hostel_groups if "water" in g.get("title", "").lower() and g.get("complaint_count", 0) >= 2), None)
if hostel_group:
    resolve_resp = req(
        "PUT", f"/staff/problems/{hostel_group['id']}/solution",
        {"solution": "Water supply has been fully restored in Hostel Block A."},
        token=staff_tok
    )
    all_passed &= check("PUT /staff/problems/{id}/solution → 200", bool(resolve_resp))
    if resolve_resp:
        all_passed &= check("group status == resolved", resolve_resp.get("status") == "resolved", str(resolve_resp.get("status")))

    stu2_complaints = req("GET", "/complaints", token=stu2_tok)
    if stu2_complaints:
        stu2_water = [c for c in stu2_complaints if "water" in c.get("title", "").lower() and "block a" in c.get("title", "").lower()]
        all_passed &= check("Student 2 complaint → resolved", any(c.get("status") == "resolved" for c in stu2_water),
                            str([c.get("status") for c in stu2_water]))
    stu3_complaints = req("GET", "/complaints", token=stu3_tok)
    if stu3_complaints:
        stu3_water = [c for c in stu3_complaints if "water" in c.get("title", "").lower()]
        all_passed &= check("Student 3 complaint → resolved", any(c.get("status") == "resolved" for c in stu3_water),
                            str([c.get("status") for c in stu3_water]))
else:
    print("  SKIP  No multi-member hostel group found (check earlier failures)")


section("Summary")
print(f"\n  {'ALL CHECKS PASSED' if all_passed else 'SOME CHECKS FAILED'}")
sys.exit(0 if all_passed else 1)
