import asyncio
import time
from typing import Any, Awaitable, Callable


class AsyncTTLCache:
    def __init__(self, ttl: float, max_size: int = 512, fail_ttl: float = 0.0) -> None:
        self.ttl = ttl
        self.max_size = max_size
        self.fail_ttl = fail_ttl
        self.store: dict[str, tuple[float, Any]] = {}
        self.failures: dict[str, float] = {}
        self.inflight: dict[str, asyncio.Task] = {}

    async def get_or_load(self, key: str, loader: Callable[[], Awaitable[Any]]) -> Any:
        now = time.monotonic()
        entry = self.store.get(key)
        if entry is not None and entry[0] > now:
            return entry[1]

        until = self.failures.get(key)
        if until is not None:
            if until > now:
                raise RuntimeError("source is cooling down after a failure")
            del self.failures[key]

        task = self.inflight.get(key)
        if task is None:
            task = asyncio.create_task(self._load(key, loader))
            self.inflight[key] = task
        return await asyncio.shield(task)

    async def _load(self, key: str, loader: Callable[[], Awaitable[Any]]) -> Any:
        try:
            value = await loader()
        except Exception:
            stale = self.store.get(key)
            if stale is not None:
                self.store[key] = (time.monotonic() + min(self.ttl, 30.0), stale[1])
                return stale[1]
            if self.fail_ttl:
                self.failures[key] = time.monotonic() + self.fail_ttl
            raise
        finally:
            self.inflight.pop(key, None)

        self.store.pop(key, None)
        self.store[key] = (time.monotonic() + self.ttl, value)
        while len(self.store) > self.max_size:
            del self.store[next(iter(self.store))]
        return value