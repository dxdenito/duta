import asyncio
import calendar
import heapq
import html
import logging
import re
import time
from datetime import datetime, timezone
from operator import itemgetter
from typing import Any

import feedparser

from app.cache import AsyncTTLCache
from app.http import get_client
from app.news.feeds import CATEGORIES, TABS, Category, Feed, Section

logger = logging.getLogger("duta.news")

TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")
KEY_RE = re.compile(r"[^a-z0-9]+")
SUMMARY_MAX = 220

feed_cache = AsyncTTLCache(ttl=300, max_size=256, fail_ttl=60)
category_cache = AsyncTTLCache(ttl=120, max_size=32)


class UnknownCategory(Exception):
    pass


class NewsUnavailable(Exception):
    pass


def clean_text(raw: str, limit: int) -> str:
    text = SPACE_RE.sub(" ", html.unescape(TAG_RE.sub(" ", raw))).strip()
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0] + "…"


def extract_image(entry: Any) -> str | None:
    for key in ("media_thumbnail", "media_content"):
        media = entry.get(key)
        if media:
            url = media[0].get("url")
            if url:
                return url
    for enclosure in entry.get("enclosures", ()):
        if enclosure.get("type", "").startswith("image/") and enclosure.get("href"):
            return enclosure["href"]
    return None


def parse_feed(feed: Feed, content: bytes) -> list[dict[str, Any]]:
    parsed = feedparser.parse(content)
    items: list[dict[str, Any]] = []
    for entry in parsed.entries:
        title = entry.get("title", "").strip()
        link = entry.get("link")
        if not title or not link:
            continue

        stamp = entry.get("published_parsed") or entry.get("updated_parsed")
        source = feed.name
        summary = ""

        if feed.aggregator:
            origin = entry.get("source")
            if origin and origin.get("title"):
                source = origin["title"]
                title = title.removesuffix(f" - {source}")
        else:
            summary = clean_text(entry.get("summary", ""), SUMMARY_MAX)

        items.append(
            {
                "title": clean_text(title, 300),
                "link": link,
                "source": source,
                "summary": summary,
                "image": extract_image(entry),
                "ts": calendar.timegm(stamp) if stamp else 0,
            }
        )
    items.sort(key=itemgetter("ts"), reverse=True)
    return items


async def fetch_feed(feed: Feed) -> list[dict[str, Any]]:
    response = await get_client().get(feed.url)
    response.raise_for_status()
    return await asyncio.to_thread(parse_feed, feed, response.content)


async def get_feed(feed: Feed) -> list[dict[str, Any]]:
    return await feed_cache.get_or_load(feed.url, lambda: fetch_feed(feed))


def public(item: dict[str, Any]) -> dict[str, Any]:
    ts = item["ts"]
    return {
        "title": item["title"],
        "link": item["link"],
        "source": item["source"],
        "summary": item["summary"],
        "image": item["image"],
        "published": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else None,
    }


async def build_section(section: Section) -> dict[str, Any]:
    results = await asyncio.gather(
        *(get_feed(feed) for feed in section.feeds), return_exceptions=True
    )

    lists: list[list[dict[str, Any]]] = []
    for feed, result in zip(section.feeds, results):
        if isinstance(result, BaseException):
            logger.warning("Feed failed: %s (%r)", feed.url, result)
            continue
        lists.append(result)

    merged = heapq.merge(*lists, key=itemgetter("ts"), reverse=True)

    seen: set[str] = set()
    picked: list[dict[str, Any]] = []
    for item in merged:
        key = KEY_RE.sub("", item["title"].lower())[:80]
        if key in seen:
            continue
        seen.add(key)
        picked.append(public(item))
        if len(picked) == section.limit:
            break

    return {"label": section.label, "items": picked}


async def build_category(category: Category) -> dict[str, Any]:
    sections = await asyncio.gather(*(build_section(s) for s in category.sections))
    sections = [s for s in sections if s["items"]]
    if not sections:
        raise NewsUnavailable(category.id)
    return {
        "category": category.id,
        "label": category.label,
        "sections": sections,
        "updated": datetime.now(timezone.utc).isoformat(),
    }


async def get_news(category_id: str) -> dict[str, Any]:
    category = CATEGORIES.get(category_id)
    if category is None:
        raise UnknownCategory(category_id)
    data = await category_cache.get_or_load(category_id, lambda: build_category(category))
    return {**data, "tabs": TABS}


def all_feeds() -> list[Feed]:
    unique: dict[str, Feed] = {}
    for category in CATEGORIES.values():
        for section in category.sections:
            for feed in section.feeds:
                unique.setdefault(feed.url, feed)
    return list(unique.values())


async def probe(feed: Feed) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        items = await get_feed(feed)
    except Exception as exc:
        return {"name": feed.name, "url": feed.url, "ok": False, "error": repr(exc)[:200]}
    return {
        "name": feed.name,
        "url": feed.url,
        "ok": True,
        "items": len(items),
        "ms": round((time.perf_counter() - started) * 1000),
    }


async def feed_status() -> dict[str, Any]:
    results = await asyncio.gather(*(probe(f) for f in all_feeds()))
    results.sort(key=itemgetter("ok"))
    failed = sum(1 for r in results if not r["ok"])
    return {"total": len(results), "failed": failed, "feeds": results}