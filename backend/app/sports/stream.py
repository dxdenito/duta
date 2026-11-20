import asyncio
import json
from bisect import bisect_right
from operator import itemgetter
from typing import Any, AsyncIterator

from fastapi import Request

from app.sports import service

LIVE_INTERVAL = 10
IDLE_INTERVAL = 30


def sse(event: str, data: Any, event_id: int | None = None) -> str:
    lines = [f"event: {event}"]
    if event_id is not None:
        lines.append(f"id: {event_id}")
    lines.append(f"data: {json.dumps(data, separators=(',', ':'))}")
    return "\n".join(lines) + "\n\n"


async def match_events(
    request: Request, league: str, event_id: str, after: int
) -> AsyncIterator[str]:
    last_seq = after
    last_status: tuple[Any, ...] | None = None

    while True:
        if await request.is_disconnected():
            return

        try:
            data = await service.get_match(league, event_id)
        except service.MatchNotFound:
            yield sse("end", {})
            return
        except service.SportsUnavailable:
            yield ": waiting\n\n"
            await asyncio.sleep(IDLE_INTERVAL)
            continue

        match = data["match"]
        feed = data["feed"]
        sent = False

        status_key = (
            match["home"]["score"],
            match["away"]["score"],
            match["status"],
            match["state"],
        )
        if status_key != last_status:
            last_status = status_key
            yield sse("match", match)
            sent = True

        fresh = feed[bisect_right(feed, last_seq, key=itemgetter("seq")) :]
        if fresh:
            last_seq = fresh[-1]["seq"]
            yield sse("commentary", {"items": fresh}, last_seq)
            sent = True

        if match["state"] == "post":
            yield sse("end", {})
            return

        if not sent:
            yield ": ping\n\n"

        await asyncio.sleep(LIVE_INTERVAL if match["state"] == "in" else IDLE_INTERVAL)