import re


# More specific department/location terms receive higher weight than
# generic infrastructure words such as "water", "electricity", etc.
DEPARTMENT_KEYWORDS = {
    "CSE": {
        "cse": 10,
        "computer science": 10,
        "computer science engineering": 10,
        "cse department": 12,
        "cse lab": 12,
        "computer lab": 8,
    },
    "AIML": {
        "aiml": 10,
        "artificial intelligence": 10,
        "machine learning": 10,
        "aiml department": 12,
        "aiml lab": 12,
    },
    "CSBS": {
        "csbs": 10,
        "computer science and business systems": 10,
        "csbs department": 12,
        "csbs lab": 12,
    },
    "Mechanical": {
        "mechanical": 10,
        "mechanical department": 12,
        "mechanical lab": 12,
        "workshop": 7,
    },
    "Electrical": {
        "electrical": 10,
        "electrical department": 12,
        "electrical lab": 12,
        "power": 3,
        "voltage": 3,
    },
    "ENTC": {
        "entc": 10,
        "electronics and telecommunication": 10,
        "entc department": 12,
        "entc lab": 12,
    },
    "Biotech": {
        "biotech": 10,
        "biotechnology": 10,
        "biotech department": 12,
        "biotech lab": 12,
    },
    "Exam Cell": {
        "exam cell": 12,
        "examination cell": 12,
        "exam": 5,
        "marks": 5,
        "result": 5,
        "hall ticket": 8,
        "backlog": 5,
    },
    "Canteen": {
        "canteen": 12,
        "cafeteria": 10,
        "food": 4,
        "meal": 4,
        "lunch": 4,
        "breakfast": 4,
    },
    "Hostel": {
        "hostel": 12,
        "hostel block": 14,
        "hostel room": 14,
        "warden": 8,
        "mess": 8,
        "washroom": 6,
        "bathroom": 6,
        "plumbing": 5,
        "water": 2,
        "leak": 3,
        "leakage": 3,
        "electricity": 3,
    },
}


def predict_department(text: str) -> str:
    """Predict department using weighted contextual keywords.

    Specific department/location phrases are intentionally weighted much
    higher than generic infrastructure terms. This prevents words such as
    "water" or "electricity" from automatically routing a complaint to
    Hostel when the complaint explicitly names another department.
    """
    text = re.sub(r"\s+", " ", text.lower()).strip()

    scores: dict[str, int] = {}

    for department, keywords in DEPARTMENT_KEYWORDS.items():
        score = 0

        for keyword, weight in keywords.items():
            if keyword in text:
                score += weight

        scores[department] = score

    best_score = max(scores.values(), default=0)

    if best_score <= 0:
        return "General Review"

    # Stable deterministic tie-breaking. Python dict insertion order means
    # department order remains predictable when scores are identical.
    for department, score in scores.items():
        if score == best_score:
            return department

    return "General Review"
