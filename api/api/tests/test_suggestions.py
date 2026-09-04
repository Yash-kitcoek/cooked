"""
Suggestion / SuggestionReview tests — DEPRECATED.

These tests targeted the old /dashboard/complaints/<id>/suggestion and
/admin/suggestions routes that were removed when the problem-grouping
pipeline replaced the legacy suggestion engine.  The SuggestionReview model
no longer exists in app.models.

Kept as an empty module so pytest can collect the suite without raising an
ImportError.  The equivalent coverage now lives in:
  - tests/test_student_problem_discovery.py
  - tests/test_lifecycle.py (staff resolve / solution propagation)
"""
