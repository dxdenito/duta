import asyncio
import html
import re
from datetime import datetime
from operator import itemgetter
from typing import Any
import logging
from bisect import bisect_left



import httpx

from app.cache import AsyncTTLCache
from app.http import get_client
from app.sports.leagues import LEAGUE_MAP, LEAGUES

BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer"
STATE_RANK = {"in": 0, "pre": 1, "post": 2}
TAG_RE = re.compile(r"<[^>]+>")

scores_cache = AsyncTTLCache(ttl=20, max_size=64, fail_ttl=10)
match_cache = AsyncTTLCache(ttl=10, max_size=300, fail_ttl=10)
logger = logging.getLogger("duta.sports")

class UnknownLeague(Exception):
    pass


class MatchNotFound(Exception):
    pass


class SportsUnavailable(Exception):
    pass


def require_league(league: str) -> None:
    if league not in LEAGUE_MAP:
        raise UnknownLeague(league)


def to_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def parse_ts(value: str) -> int:
    try:
        return int(datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp())
    except ValueError:
        return 0


def sort_key(match: dict[str, Any]) -> tuple[int, int]:
    rank = STATE_RANK.get(match["state"], 1)
    return rank, -match["ts"] if match["state"] == "post" else match["ts"]


def classify(type_text: str, scoring: bool) -> str:
    label = type_text.lower()
    if scoring or label.startswith("goal") or "own goal" in label:
        return "goal"
    if "red card" in label:
        return "red-card"
    if "card" in label:
        return "card"
    if "substitution" in label:
        return "sub"
    return "info"


def shape_team(competitor: dict[str, Any]) -> dict[str, Any]:
    team = competitor.get("team") or {}
    logo = team.get("logo") or ((team.get("logos") or [{}])[0]).get("href")
    return {
        "name": team.get("displayName") or team.get("name") or "",
        "short": team.get("abbreviation") or team.get("shortDisplayName") or "",
        "logo": logo,
        "score": to_int(competitor.get("score")),
    }


def shape_competition(
    league: str,
    event_id: str,
    competition: dict[str, Any],
    event: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    event = event or {}
    competitors = competition.get("competitors") or []
    home = next((c for c in competitors if c.get("homeAway") == "home"), None)
    away = next((c for c in competitors if c.get("homeAway") == "away"), None)
    if home is None or away is None:
        return None

    status = competition.get("status") or event.get("status") or {}
    kind = status.get("type") or {}
    kickoff = competition.get("date") or event.get("date") or ""

    return {
        "id": event_id,
        "league": league,
        "league_name": LEAGUE_MAP[league].name,
        "kickoff": kickoff,
        "ts": parse_ts(kickoff),
        "state": kind.get("state") or "pre",
        "status": kind.get("shortDetail") or kind.get("detail") or kind.get("description") or "",
        "home": shape_team(home),
        "away": shape_team(away),
        "venue": (competition.get("venue") or {}).get("fullName", ""),
    }


def entry_seq(entry: dict[str, Any], index: int) -> int:
    raw = entry.get("sequence")
    if raw is None:
        raw = entry.get("sequenceNumber")
    parsed = to_int(raw)
    return parsed if parsed is not None else index + 1


def shape_entry(entry: dict[str, Any], index: int) -> dict[str, Any] | None:
    play = entry.get("play") or {}
    clock = entry.get("time") or entry.get("clock") or play.get("clock") or {}
    minute = clock.get("displayValue", "") if isinstance(clock, dict) else str(clock)
    kind = entry.get("type") or play.get("type") or {}
    type_text = kind.get("text", "") if isinstance(kind, dict) else ""
    scoring = bool(entry.get("scoringPlay") or play.get("scoringPlay"))
    raw = entry.get("text") or play.get("text") or entry.get("shortText") or ""
    text = html.unescape(TAG_RE.sub("", str(raw))).strip()
    if not text:
        return None
    return {
        "seq": entry_seq(entry, index),
        "minute": minute,
        "text": text,
        "kind": classify(type_text, scoring),
    }


def build_feed(data: dict[str, Any]) -> tuple[list[dict[str, Any]], str]:
    for key in ("commentary", "keyEvents"):
        entries = data.get(key) or []
        items = [item for item in (shape_entry(e, n) for n, e in enumerate(entries)) if item]
        if items:
            items.sort(key=itemgetter("seq"))
            return items, key
    return [], "none"


async def get_json(url: str, params: dict[str, Any]) -> dict[str, Any] | None:
    response = await get_client().get(url, params=params)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()


def shape_events(league: str, data: dict[str, Any] | None) -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    for event in (data or {}).get("events", []):
        competitions = event.get("competitions") or []
        if not competitions:
            continue
        match = shape_competition(league, str(event.get("id", "")), competitions[0], event)
        if match:
            matches.append(match)
    return matches


def matchday_before(data: dict[str, Any]) -> str | None:
    current = (data.get("day") or {}).get("date")
    leagues = data.get("leagues") or []
    calendar = (leagues[0].get("calendar") if leagues else None) or []
    if not current:
        return None
    days = sorted(entry[:10] for entry in calendar if isinstance(entry, str) and len(entry) >= 10)
    index = bisect_left(days, current)
    return days[index - 1].replace("-", "") if index else None


async def fetch_scores(league: str) -> list[dict[str, Any]]:
    url = f"{BASE}/{league}/scoreboard"
    data = await get_json(url, {})
    matches = shape_events(league, data)

    if data and not any(match["state"] != "pre" for match in matches):
        previous = matchday_before(data)
        if previous:
            try:
                matches += shape_events(league, await get_json(url, {"dates": previous}))
            except httpx.HTTPError as exc:
                logger.warning("Previous matchday failed for %s: %r", league, exc)

    matches.sort(key=sort_key)
    return matches


async def get_scores(league: str) -> list[dict[str, Any]]:
    require_league(league)
    try:
        return await scores_cache.get_or_load(league, lambda: fetch_scores(league))
    except (httpx.HTTPError, RuntimeError) as exc:
        logger.warning("ESPN request failed: %r", exc)
        raise SportsUnavailable(repr(exc)) from exc


async def fetch_match(league: str, event_id: str) -> dict[str, Any] | None:
    data = await get_json(f"{BASE}/{league}/summary", {"event": event_id})
    if not data:
        return None
    header = data.get("header") or {}
    competitions = header.get("competitions") or []
    if not competitions:
        return None
    match = shape_competition(league, event_id, competitions[0], header)
    if match is None:
        return None
    feed, source = build_feed(data)
    return {"match": match, "feed": feed, "source": source}


async def get_match(league: str, event_id: str) -> dict[str, Any]:
    require_league(league)
    try:
        data = await match_cache.get_or_load(
            f"{league}:{event_id}", lambda: fetch_match(league, event_id)
        )
    except (httpx.HTTPError, RuntimeError) as exc:
        logger.warning("ESPN request failed: %r", exc)
        raise SportsUnavailable(repr(exc)) from exc
    if data is None:
        raise MatchNotFound(event_id)
    return data


async def scores_payload(league: str) -> dict[str, Any]:
    require_league(league)
    matches = await get_scores(league)
    return {"title": LEAGUE_MAP[league].name, "league": league, "matches": matches}


async def live_payload() -> dict[str, Any]:
    results = await asyncio.gather(
        *(get_scores(league.id) for league in LEAGUES), return_exceptions=True
    )
    live: list[dict[str, Any]] = []
    failures = 0
    for result in results:
        if isinstance(result, BaseException):
            failures += 1
            continue
        live.extend(match for match in result if match["state"] == "in")
    if failures == len(results):
        raise SportsUnavailable("every league failed")
    return {"title": "Live now", "league": None, "matches": live}


def league_list() -> list[dict[str, str]]:
    return [{"id": l.id, "name": l.name, "region": l.region} for l in LEAGUES]


async def probe(league: Any) -> dict[str, Any]:
    try:
        matches = await get_scores(league.id)
    except Exception as exc:
        return {"id": league.id, "name": league.name, "ok": False, "error": repr(exc)[:200]}
    return {
        "id": league.id,
        "name": league.name,
        "ok": True,
        "matches": len(matches),
        "live": sum(1 for match in matches if match["state"] == "in"),
    }


async def check() -> dict[str, Any]:
    results = await asyncio.gather(*(probe(league) for league in LEAGUES))
    results.sort(key=itemgetter("ok"))
    failed = sum(1 for result in results if not result["ok"])
    return {"total": len(results), "failed": failed, "leagues": results}


async def debug_match(league: str, event_id: str) -> dict[str, Any]:
    require_league(league)
    try:
        data = await get_json(f"{BASE}/{league}/summary", {"event": event_id})
    except httpx.HTTPError as exc:
        raise SportsUnavailable(str(exc)) from exc
    if not data:
        raise MatchNotFound(event_id)
    commentary = data.get("commentary") or []
    key_events = data.get("keyEvents") or []
    return {
        "keys": sorted(data),
        "commentary_count": len(commentary),
        "key_events_count": len(key_events),
        "sample_commentary": commentary[:1],
        "sample_key_event": key_events[:1],
    }