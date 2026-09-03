from pathlib import Path
from uuid import uuid4


def attachment_path(upload_dir: Path, filename: str) -> Path:
    return upload_dir / f"{uuid4()}-{Path(filename).name}"
