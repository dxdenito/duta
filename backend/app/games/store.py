import time
from collections import OrderedDict
from secrets import token_urlsafe
from typing import Any


class GameStore:
    def __init__(self, ttl: float = 3600.0, max_size: int = 5000) -> None:
        self.ttl = ttl
        self.max_size = max_size
        self.items: OrderedDict[str, tuple[float, Any]] = OrderedDict()

    def create(self, game: Any) -> str:
        game_id = token_urlsafe(8)
        self.items[game_id] = (time.monotonic() + self.ttl, game)
        self._evict()
        return game_id

    def get(self, game_id: str) -> Any | None:
        entry = self.items.get(game_id)
        if entry is None:
            return None
        now = time.monotonic()
        if entry[0] <= now:
            del self.items[game_id]
            return None
        self.items[game_id] = (now + self.ttl, entry[1])
        self.items.move_to_end(game_id)
        return entry[1]

    def _evict(self) -> None:
        now = time.monotonic()
        while self.items:
            oldest = next(iter(self.items.values()))
            if len(self.items) <= self.max_size and oldest[0] > now:
                break
            self.items.popitem(last=False)