DEPTS={
 "Electrical":["light","fan","switch","wire"],
 "Water":["water","tap","leak","pipe"],
 "Network":["wifi","internet","network"],
 "Hostel":["room","hostel","washroom","clean"]
}
def predict_department(text:str):
    t=text.lower()
    for d,keys in DEPTS.items():
        if any(k in t for k in keys):
            return d
    return "General"
