import time

import redis
from fastapi import HTTPException, Request, status

from app.config import settings

_memory: dict[str, tuple[int, float]] = {}


class RateLimiter:
    def __init__(self, limit: int = 120, window_seconds: int = 60) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        try:
            self.client = redis.from_url(settings.redis_url, decode_responses=True)
            self.client.ping()
        except Exception:
            self.client = None

    def client_ip(self, request: Request) -> str:
        # Behind a proxy every request carries the proxy's address, which would
        # put the whole internet in one bucket. Only believe the forwarded hop
        # when the deployment guarantees the proxy rewrites the header.
        if settings.trust_proxy_headers:
            forwarded = request.headers.get("x-forwarded-for", "")
            if forwarded:
                return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def __call__(self, request: Request) -> None:
        window = int(time.time() // self.window_seconds)
        key = f"rate:{self.client_ip(request)}:{window}"
        if self.client:
            count = self.client.incr(key)
            self.client.expire(key, self.window_seconds)
        else:
            for stale in [k for k in _memory if not k.endswith(f":{window}")]:
                del _memory[stale]
            count, expires = _memory.get(key, (0, time.time() + self.window_seconds))
            if time.time() > expires:
                count = 0
                expires = time.time() + self.window_seconds
            count += 1
            _memory[key] = (count, expires)
        if count > self.limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="rate limit exceeded")
