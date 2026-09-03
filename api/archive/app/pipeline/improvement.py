def suggest_improvement(department: str, category: str, count: int) -> str:
    return (
        f"{count} complaints in {department}/{category} indicate a recurring process gap. "
        f"Recommend: audit root cause with {department} head, publish a standing SOP, "
        f"and set a proactive SLA check before the next reporting cycle."
    )
