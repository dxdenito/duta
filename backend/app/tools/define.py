import re
from itertools import islice
from typing import Any
from urllib.parse import quote

from app.cache import AsyncTTLCache
from app.http import get_client
from app.tools.common import BadInput, NotFound, cached

URL = "https://api.dictionaryapi.dev/api/v2/entries/en/"
WORD_RE = re.compile(r"^[A-Za-z][A-Za-z' -]{0,38}$")
MAX_MEANINGS = 5
MAX_DEFINITIONS = 3
MAX_SYNONYMS = 8

cache = AsyncTTLCache(ttl=86400, max_size=2000, fail_ttl=30)


def fix_url(url: str | None) -> str | None:
    if not url:
        return None
    return "https:" + url if url.startswith("//") else url


def shape(entries: list[dict[str, Any]]) -> dict[str, Any]:
    phonetic = ""
    audio: str | None = None
    meanings: dict[str, list[dict[str, str]]] = {}
    synonyms: dict[str, None] = {}

    for entry in entries:
        phonetic = phonetic or entry.get("phonetic") or ""
        for item in entry.get("phonetics") or []:
            phonetic = phonetic or item.get("text") or ""
            audio = audio or fix_url(item.get("audio"))
        for meaning in entry.get("meanings") or []:
            bucket = meanings.setdefault(meaning.get("partOfSpeech") or "other", [])
            for synonym in meaning.get("synonyms") or []:
                synonyms.setdefault(synonym)
            for definition in meaning.get("definitions") or []:
                if len(bucket) < MAX_DEFINITIONS and definition.get("definition"):
                    bucket.append(
                        {
                            "definition": definition["definition"],
                            "example": definition.get("example") or "",
                        }
                    )
                for synonym in definition.get("synonyms") or []:
                    synonyms.setdefault(synonym)

    return {
        "word": entries[0].get("word", ""),
        "phonetic": phonetic,
        "audio": audio,
        "meanings": [
            {"part": part, "definitions": definitions}
            for part, definitions in islice(meanings.items(), MAX_MEANINGS)
            if definitions
        ],
        "synonyms": list(islice(synonyms, MAX_SYNONYMS)),
    }


async def fetch(word: str) -> dict[str, Any] | None:
    response = await get_client().get(URL + quote(word, safe=""))
    if response.status_code == 404:
        return None
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, list) or not data:
        return None
    return shape(data)


async def define(text: str) -> dict[str, Any]:
    word = " ".join(text.split()).lower()
    if not WORD_RE.match(word):
        raise BadInput("Please enter a single English word.")
    result = await cached(cache, word, lambda: fetch(word), "The dictionary")
    if result is None:
        raise NotFound(f'No definition found for "{word}".')
    return result