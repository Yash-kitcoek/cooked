"""Pydantic schema namespace with a compatibility bridge to schemas.py."""

import importlib.util
from pathlib import Path
import sys

_legacy_name = "app._legacy_schemas"
_legacy_path = Path(__file__).resolve().parent.parent / "schemas.py"
_spec = importlib.util.spec_from_file_location(_legacy_name, _legacy_path)
if _spec is None or _spec.loader is None:
	raise ImportError(f"Unable to load legacy schemas from {_legacy_path}")
_legacy = importlib.util.module_from_spec(_spec)
sys.modules[_legacy_name] = _legacy
_spec.loader.exec_module(_legacy)

for _name in dir(_legacy):
	if not _name.startswith("_"):
		globals()[_name] = getattr(_legacy, _name)
