import hashlib
import numpy as np

def embed(text: str) -> np.ndarray:
    # Deterministic 32-dimensional embedding
    h = hashlib.sha256(text.lower().encode()).digest()
    return np.array([b / 255.0 for b in h], dtype=float)

def cosine_similarity(a: np.ndarray, b) -> float:
    b = np.array(b, dtype=float)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)