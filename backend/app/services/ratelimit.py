"""Tiny in-memory sliding-window rate limiter (per key, per process).

Adequate for a single-process demo deployment; it is NOT shared across
workers/instances and resets on restart. Put a real limiter (gateway/Redis)
in front for anything beyond a demo.
"""
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Optional


class SlidingWindowLimiter:
    def __init__(self, window_seconds: int = 60):
        self.window = window_seconds
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str, limit: int, now: Optional[float] = None) -> bool:
        now = time.monotonic() if now is None else now
        q = self._hits[key]
        while q and now - q[0] >= self.window:
            q.popleft()
        if len(q) >= limit:
            return False
        q.append(now)
        return True

    def reset(self) -> None:
        self._hits.clear()


demo_login_limiter = SlidingWindowLimiter(window_seconds=60)
