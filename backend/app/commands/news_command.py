from typing import Any

from app.commands.registry import registry
from app.news.feeds import CATEGORIES, resolve_category
from app.news.service import NewsUnavailable, get_news


async def load(category_id: str) -> dict[str, Any]:
    try:
        data = await get_news(category_id)
    except NewsUnavailable:
        return {
            "type": "error",
            "data": {"message": "News is unavailable right now. Please try again shortly."},
        }
    return {"type": "news", "data": data}


@registry.command(
    "news",
    "Latest headlines by category",
    "/news [top|politics|business|world|sports|tech]",
    aliases=("n",),
)
async def news_command(args: str) -> dict[str, Any]:
    category_id = resolve_category(args)
    if category_id is None:
        names = ", ".join(CATEGORIES)
        return {"type": "error", "data": {"message": f"Unknown category. Try: {names}"}}
    return await load(category_id)


@registry.command("nse", "NSE and Kenya stock market news", "/nse")
async def nse_command(args: str) -> dict[str, Any]:
    return await load("business")