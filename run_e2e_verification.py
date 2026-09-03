import httpx
import sys
import os
import time

BASE_URL = "http://localhost:8000"

def run_tests():
    print("=== STARTING E2E API VERIFICATION ===")
    
    print("\n--- Logging in ---")
    login = httpx.post(f"{BASE_URL}/auth/login", json={"username": "e2e_admin", "password": "password123"})
    if login.status_code != 200:
        print("FATAL: Could not login as e2e_admin")
        sys.exit(1)
        
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Logged in successfully. Status: {login.status_code}")

    print("\n=== 1. /staff/problems fix ===")
    
    r1 = httpx.get(f"{BASE_URL}/staff/problems", headers=headers)
    print(f"GET /staff/problems -> Status {r1.status_code}")
    if r1.status_code == 200:
        data1 = r1.json()
        print(f"Result count: {len(data1)}")
        if len(data1) > 0:
            print(f"Sample fields (first item): category={data1[0].get('category')}, urgency_score={data1[0].get('urgency_score')}, impact_score={data1[0].get('impact_score')}, priority_score={data1[0].get('priority_score')}")
    else:
        print(f"Error output: {r1.text}")

    r2 = httpx.get(f"{BASE_URL}/staff/problems?priority=high", headers=headers)
    print(f"GET /staff/problems?priority=high -> Status {r2.status_code}")

    r3 = httpx.get(f"{BASE_URL}/staff/problems?q=water", headers=headers)
    print(f"GET /staff/problems?q=water -> Status {r3.status_code}")

    if 'data1' in locals() and len(data1) > 0:
        group_id = data1[0]['id']
        r4 = httpx.get(f"{BASE_URL}/staff/problems/{group_id}", headers=headers)
        print(f"GET /staff/problems/{{id}} ({group_id}) -> Status {r4.status_code}")
        if r4.status_code == 200:
            d = r4.json()
            print(f"Students count: {len(d.get('students', []))}")
            print(f"Complaints count: {len(d.get('complaints', []))}")

    print("\n=== 2. Central Thought scoring correctness ===")
    
    print("\n--- Submitting High Urgency Complaint (fire/spark) ---")
    student_login = httpx.post(f"{BASE_URL}/auth/login", json={"username": "e2e_student", "password": "password123"})
    student_headers = {"Authorization": f"Bearer {student_login.json()['access_token']}"}
    
    urgent_payload = {
        "title": "Major fire hazard",
        "description": "There is a fire and severe spark near the main electrical panel. Unsafe conditions."
    }
    urgent_req = httpx.post(f"{BASE_URL}/complaints", json=urgent_payload, headers=student_headers)
    print(f"Urgent Complaint POST -> Status {urgent_req.status_code}")
    urgent_comp = urgent_req.json()
    
    print("\n--- Submitting Low Urgency Complaint (dust) ---")
    low_payload = {
        "title": "Dust on shelf",
        "description": "There is some dust on the bookshelf in the library."
    }
    low_req = httpx.post(f"{BASE_URL}/complaints", json=low_payload, headers=student_headers)
    print(f"Low Complaint POST -> Status {low_req.status_code}")
    low_comp = low_req.json()
    
    print("\nWaiting 2 seconds for worker to process classifications...")
    time.sleep(2)
    
    # Check problem groups for the new complaints
    u_group_id = urgent_comp.get("problem_group_id")
    l_group_id = low_comp.get("problem_group_id")
    
    if u_group_id:
        admin_login = httpx.post(f"{BASE_URL}/auth/login", json={"username": "e2e_admin", "password": "password123"})
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
        
        ug_req = httpx.get(f"{BASE_URL}/staff/problems/{u_group_id}", headers=admin_headers)
        if ug_req.status_code == 200:
            ug = ug_req.json()
            print(f"Urgent Group: Priority Score={ug.get('priority_score')}, Priority={ug.get('priority')}, Category={ug.get('category')}")
            
    if l_group_id:
        lg_req = httpx.get(f"{BASE_URL}/staff/problems/{l_group_id}", headers=admin_headers)
        if lg_req.status_code == 200:
            lg = lg_req.json()
            print(f"Low Group: Priority Score={lg.get('priority_score')}, Priority={lg.get('priority')}, Category={lg.get('category')}")

    print("\n=== 4. Department / SLA policy fix ===")
    try:
        from app.database import SessionLocal
        from app.models import DepartmentPolicy
        db = SessionLocal()
        policies = db.query(DepartmentPolicy).all()
        print(f"Total Department Policies in DB: {len(policies)}")
        for p in policies:
            print(f" - {p.name}: {p.sla_hours}h SLA")
    except Exception as e:
        print(f"Could not query DB directly: {e}")

    print("\n=== 5. Group-resolve flow ===")
    if u_group_id:
        resolve_payload = {"solution": "Fixed the spark and fire hazard"}
        res_req = httpx.put(f"{BASE_URL}/staff/problems/{u_group_id}/solution", json=resolve_payload, headers=admin_headers)
        print(f"PUT /staff/problems/{{id}}/solution -> Status {res_req.status_code}")
        if res_req.status_code == 200:
            print(f"Group status: {res_req.json().get('status')}")
            print("Checking individual complaint status...")
            comp_req = httpx.get(f"{BASE_URL}/complaints/{urgent_comp['id']}", headers=student_headers)
            print(f"Complaint {urgent_comp['id']} status: {comp_req.json().get('status')}")

if __name__ == '__main__':
    run_tests()
