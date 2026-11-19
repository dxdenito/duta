from typing import Any

from app.commands.registry import registry
from app.wiki.service import ArticleNotFound, WikiUnavailable, lookup, random_article


def failure(message: str) -> dict[str, Any]:
    return {"type": "error", "data": {"message": message}}


async def wiki_result(topic: str) -> dict[str, Any]:
    try:
        data = await lookup(topic)
    except ArticleNotFound:
        return failure(f'No Wikipedia article found for "{topic}".')
    except WikiUnavailable:
        return failure("Wikipedia is unreachable right now. Please try again shortly.")
    return {"type": "wiki", "data": data}


async def random_result() -> dict[str, Any]:
    try:
        data = await random_article()
    except WikiUnavailable:
        return failure("Wikipedia is unreachable right now. Please try again shortly.")
    return {"type": "wiki", "data": data}


@registry.command("wiki", "Look up a Wikipedia article", "/wiki <topic>", aliases=("w",))
async def wiki_command(args: str) -> dict[str, Any]:
    topic = args.strip()
    if not topic:
        return failure("What should I look up? Try /wiki Kilimanjaro")
    if topic.lower() == "random":
        return await random_result()
    return await wiki_result(topic)


@registry.command("random", "A random Wikipedia article", "/random")
async def random_command(args: str) -> dict[str, Any]:
    return await random_result()


@registry.set_fallback
async def ask(args: str) -> dict[str, Any]:
    return await wiki_result(args)