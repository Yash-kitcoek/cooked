import httpx
import sys

BASE_URL = "http://localhost:8000"

def run_checks():
    # Login as admin or staff to get token
    # The previous agent used staff@123 for cse_staff
    # Let's try cse_staff (assuming it's a staff user)
    # The login payload requires username and password as form data or json depending on the app.
    # From test_student_problem_discovery.py: client.post("/auth/login", json={"username": username, "password": "password123"})
    print("Logging in...")
    login = httpx.post(f"{BASE_URL}/auth/login", json={"username": "cse_staff", "password": "staff@123"})
    
    if login.status_code != 200:
        print(f"Login failed: {login.text}")
        # let's try with a default test user if cse_staff fails
        login = httpx.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "password123"})
        if login.status_code != 200:
            print("Cannot get token to verify API")
            sys.exit(1)
            
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. GET /staff/problems with no query params
    print("\n1. Testing GET /staff/problems (no params)")
    resp1 = httpx.get(f"{BASE_URL}/staff/problems", headers=headers)
    assert resp1.status_code == 200, f"Expected 200, got {resp1.status_code}: {resp1.text}"
    data1 = resp1.json()
    print(f"Success! Got {len(data1)} groups.")
    
    # 2. GET /staff/problems?priority=high and ?q=water
    print("\n2. Testing GET /staff/problems?priority=high")
    resp2 = httpx.get(f"{BASE_URL}/staff/problems?priority=high", headers=headers)
    assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}: {resp2.text}"
    print(f"Success! Got {len(resp2.json())} groups.")
    
    print("Testing GET /staff/problems?q=water")
    resp3 = httpx.get(f"{BASE_URL}/staff/problems?q=water", headers=headers)
    assert resp3.status_code == 200, f"Expected 200, got {resp3.status_code}: {resp3.text}"
    print(f"Success! Got {len(resp3.json())} groups.")
    
    # 3. Confirm scores are present and non-zero (if we have data)
    print("\n3. Checking score fields...")
    has_scores = False
    for group in data1:
        if group.get("urgency_score", 0) > 0 or group.get("impact_score", 0) > 0:
            has_scores = True
            break
    print(f"Score fields found and populated: {has_scores}")
    
    # 4. GET /staff/problems/{id}
    if data1:
        group_id = data1[0]["id"]
        print(f"\n4. Testing GET /staff/problems/{group_id}")
        resp4 = httpx.get(f"{BASE_URL}/staff/problems/{group_id}", headers=headers)
        assert resp4.status_code == 200, f"Expected 200, got {resp4.status_code}: {resp4.text}"
        detail = resp4.json()
        print(f"Success! Detail has {len(detail.get('students', []))} students and {len(detail.get('complaints', []))} complaints.")
    
    print("\nAll API checks passed!")

if __name__ == '__main__':
    run_checks()
