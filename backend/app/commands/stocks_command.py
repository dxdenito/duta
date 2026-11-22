from typing import Any

from app.commands.registry import registry


@registry.command(
    "stocks",
     "NSE news and price links",
    "/stocks",
    aliases=("shares", "market"),
)
async def stocks_command(args: str) -> dict[str, Any]:
    return {"type": "stocks", "data": None}