from typing import Any

from app.commands.registry import registry
from app.sports import service
from app.sports.leagues import ALIASES, resolve_league


def failure(message: str) -> dict[str, Any]:
    return {"type": "error", "data": {"message": message}}


UNAVAILABLE = "Live scores are unavailable right now. Please try again shortly."


@registry.command(
    "live",
    "Matches in play right now",
    "/live",
    aliases=("commentary",),
)
async def live_command(args: str) -> dict[str, Any]:
    try:
        data = await service.live_payload()
    except service.SportsUnavailable:
        return failure(UNAVAILABLE)
    return {"type": "scores", "data": data}


@registry.command(
    "scores",
    "Recent and upcoming matches",
    "/scores [kpl|epl|ucl|laliga|bundesliga|seriea|ligue1|afcon|caf]",
    aliases=("score",),
)
async def scores_command(args: str) -> dict[str, Any]:
    league = resolve_league(args)
    if league is None:
        return failure(f"Unknown league. Try: {', '.join(ALIASES)}")
    try:
        data = await service.scores_payload(league)
    except service.SportsUnavailable:
        return failure(UNAVAILABLE)
    return {"type": "scores", "data": data}