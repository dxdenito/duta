import asyncio
import random
import time
from typing import Any
from urllib.parse import unquote

import httpx

from app.cache import AsyncTTLCache
from app.games.kenya_trivia import KENYA
from app.http import get_client

API_URL = "https://opentdb.com/api.php"
POOL_SIZE = 50
MIN_GAP = 5.5

CATEGORIES: dict[str, int | None] = {
    "general": 9,
    "science": 17,
    "computers": 18,
    "sports": 21,
    "geography": 22,
    "history": 23,
    "kenya": None,
}

pools = AsyncTTLCache(ttl=6 * 3600, max_size=16, fail_ttl=20)
gate = asyncio.Lock()
last_call = 0.0


class TriviaUnavailable(Exception):
    pass


def normalise(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "text": unquote(item["question"]),
        "correct": unquote(item["correct_answer"]),
        "wrong": [unquote(answer) for answer in item["incorrect_answers"]],
    }


async def fetch_pool(opentdb_id: int) -> list[dict[str, Any]]:
    global last_call
    async with gate:
        wait = MIN_GAP - (time.monotonic() - last_call)
        if wait > 0:
            await asyncio.sleep(wait)
        try:
            response = await get_client().get(
                API_URL,
                params={
                    "amount": POOL_SIZE,
                    "category": opentdb_id,
                    "type": "multiple",
                    "encode": "url3986",
                },
            )
        finally:
            last_call = time.monotonic()
    response.raise_for_status()
    payload = response.json()
    if payload.get("response_code") != 0:
        raise RuntimeError(f"OpenTDB response_code {payload.get('response_code')}")
    return [normalise(item) for item in payload["results"]]


async def get_pool(category: str) -> Any:
    opentdb_id = CATEGORIES[category]
    if opentdb_id is None:
        return KENYA
    try:
        return await pools.get_or_load(category, lambda: fetch_pool(opentdb_id))
    except (httpx.HTTPError, RuntimeError) as exc:
        raise TriviaUnavailable(str(exc)) from exc


async def draw(category: str, amount: int) -> list[dict[str, Any]]:
    pool = await get_pool(category)
    return random.sample(pool, min(amount, len(pool)))