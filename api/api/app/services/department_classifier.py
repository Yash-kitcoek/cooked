# app/services/department_classifier.py

DEPARTMENT_KEYWORDS = {
    "Hostel": [
        "hostel", "room", "warden", "water", "leak", "leakage",
        "plumbing", "washroom", "bathroom", "electricity", "mess"
    ],
    "Canteen": ["canteen", "food", "meal", "lunch", "breakfast"],
    "Exam Cell": ["exam", "marks", "result", "hall ticket", "backlog"],
    "CSE": ["cse"],
    "AIML": ["aiml"],
    "CSBS": ["csbs"],
    "Mechanical": ["mechanical"],
    "Electrical": ["electrical", "power", "voltage"],
    "ENTC": ["entc"],
    "Biotech": ["biotech"],
}

def predict_department(text: str) -> str:
    text = text.lower()

    best_dept = "Hostel"   # default
    best_score = 0

    for dept, keywords in DEPARTMENT_KEYWORDS.items():
        score = sum(1 for k in keywords if k in text)
        if score > best_score:
            best_score = score
            best_dept = dept

    return best_dept