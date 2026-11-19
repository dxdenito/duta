import html
import re
from typing import Any
from urllib.parse import quote

import httpx

from app.cache import AsyncTTLCache
from app.http import get_client
from app.settings import WIKI_USER_AGENT

BASE = "https://en.wikipedia.org"
SEARCH_URL = f"{BASE}/w/rest.php/v1/search/page"
TITLE_URL = f"{BASE}/w/rest.php/v1/search/title"
SUMMARY_URL = f"{BASE}/api/rest_v1/page/summary/"
RANDOM_URL = f"{BASE}/api/rest_v1/page/random/summary"
HEADERS = {"User-Agent": WIKI_USER_AGENT, "Accept": "application/json"}

TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")
QUESTION_RE = re.compile(
    r"^(?:what(?:['’]s| is| are| was| were)|who(?:['’]s| is| was| were)"
    r"|tell me about|define|explain)\s+(?:the |a |an )?",
    re.IGNORECASE,
)

search_cache = AsyncTTLCache(ttl=3600, max_size=1000, fail_ttl=30)
summary_cache = AsyncTTLCache(ttl=3600, max_size=1000, fail_ttl=30)
suggest_cache = AsyncTTLCache(ttl=3600, max_size=2000, fail_ttl=30)


class ArticleNotFound(Exception):
    pass


class WikiUnavailable(Exception):
    pass


def extract_topic(text: str) -> str:
    normalized = SPACE_RE.sub(" ", text).strip()
    cleaned = QUESTION_RE.sub("", normalized, count=1).strip(" ?!.")
    return cleaned or normalized


def clean_text(raw: str) -> str:
    return SPACE_RE.sub(" ", html.unescape(TAG_RE.sub("", raw))).strip()


def fix_url(url: str | None) -> str | None:
    if not url:
        return None
    return "https:" + url if url.startswith("//") else url


def shape_page(page: dict[str, Any]) -> dict[str, Any]:
    thumbnail = page.get("thumbnail") or {}
    return {
        "key": page["key"],
        "title": page["title"],
        "description": page.get("description") or "",
        "excerpt": clean_text(page.get("excerpt") or ""),
        "image": fix_url(thumbnail.get("url")),
    }


def shape_summary(raw: dict[str, Any]) -> dict[str, Any]:
    thumbnail = raw.get("thumbnail") or {}
    titles = raw.get("titles") or {}
    title = raw.get("title", "")
    return {
        "key": titles.get("canonical") or title.replace(" ", "_"),
        "title": title,
        "description": raw.get("description") or "",
        "extract": raw.get("extract") or "",
        "image": thumbnail.get("source"),
        "url": ((raw.get("content_urls") or {}).get("desktop") or {}).get("page"),
        "type": raw.get("type", "standard"),
    }


async def get_json(url: str, params: dict[str, Any]) -> dict[str, Any]:
    response = await get_client().get(url, params=params, headers=HEADERS)
    response.raise_for_status()
    return response.json()


async def fetch_search(query: str, limit: int) -> list[dict[str, Any]]:
    data = await get_json(SEARCH_URL, {"q": query, "limit": limit})
    return [shape_page(page) for page in data.get("pages", [])]


async def fetch_suggest(query: str) -> list[dict[str, Any]]:
    data = await get_json(TITLE_URL, {"q": query, "limit": 6})
    return [shape_page(page) for page in data.get("pages", [])]


async def fetch_summary(key: str) -> dict[str, Any] | None:
    response = await get_client().get(SUMMARY_URL + quote(key, safe=""), headers=HEADERS)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return shape_summary(response.json())


async def search(query: str, limit: int = 6) -> list[dict[str, Any]]:
    return await search_cache.get_or_load(
        f"{limit}:{query.lower()}", lambda: fetch_search(query, limit)
    )


async def get_summary(key: str) -> dict[str, Any] | None:
    return await summary_cache.get_or_load(key, lambda: fetch_summary(key))


async def lookup(text: str) -> dict[str, Any]:
    topic = extract_topic(text)
    if not topic:
        raise ArticleNotFound(text)
    try:
        pages = await search(topic)
        if not pages:
            raise ArticleNotFound(topic)
        article = await get_summary(pages[0]["key"])
    except (httpx.HTTPError, RuntimeError) as exc:
        raise WikiUnavailable(str(exc)) from exc
    if article is None:
        raise ArticleNotFound(topic)
    return {"query": topic, "article": article, "related": pages[1:]}


async def article(key: str) -> dict[str, Any]:
    try:
        summary = await get_summary(key)
    except (httpx.HTTPError, RuntimeError) as exc:
        raise WikiUnavailable(str(exc)) from exc
    if summary is None:
        raise ArticleNotFound(key)
    return {"query": key, "article": summary, "related": []}


async def random_article() -> dict[str, Any]:
    try:
        response = await get_client().get(RANDOM_URL, headers=HEADERS)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise WikiUnavailable(str(exc)) from exc
    return {"query": "", "article": shape_summary(response.json()), "related": []}


async def suggest(text: str) -> list[dict[str, Any]]:
    query = SPACE_RE.sub(" ", text).strip()
    if len(query) < 2:
        return []
    try:
        return await suggest_cache.get_or_load(query.lower(), lambda: fetch_suggest(query))
    except (httpx.HTTPError, RuntimeError) as exc:
        raise WikiUnavailable(str(exc)) from exc