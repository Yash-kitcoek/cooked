"""Backward-compatible imports for the complaint intelligence pipeline."""

from app.pipeline.orchestrator import analyze_complaint
from app.pipeline.policies import DEFAULT_POLICIES, ensure_default_policies

__all__ = ["DEFAULT_POLICIES", "analyze_complaint", "ensure_default_policies"]
