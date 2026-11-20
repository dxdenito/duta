from typing import Any, Awaitable, Callable

from app.commands.registry import registry
from app.games import hangman, scramble, trivia
from app.games.catalog import CATALOG
from app.games.errors import UnknownCategory
from app.games.trivia_source import TriviaUnavailable
from app.games.words import CATEGORY_IDS


def failure(message: str) -> dict[str, Any]:
    return {"type": "error", "data": {"message": message}}


def game_result(game: str, state: dict[str, Any]) -> dict[str, Any]:
    return {"type": "game", "data": {"game": game, "state": state}}


async def start_hangman(category: str | None) -> dict[str, Any]:
    try:
        state = hangman.start(category)
    except hangman.UnknownCategory:
        return failure(f"Unknown category. Try: {', '.join(CATEGORY_IDS)}")
    return game_result("hangman", state)


async def start_scramble(category: str | None) -> dict[str, Any]:
    try:
        state = scramble.start(category)
    except UnknownCategory:
        return failure(f"Unknown category. Try: {', '.join(CATEGORY_IDS)}")
    return game_result("scramble", state)


async def start_trivia(category: str | None) -> dict[str, Any]:
    try:
        state = await trivia.start(category)
    except UnknownCategory:
        return failure(f"Unknown category. Try: {', '.join(trivia.CATEGORY_IDS)}")
    except TriviaUnavailable:
        return failure("Trivia is unavailable right now. Try /trivia kenya or try again shortly.")
    return game_result("trivia", state)


Launcher = Callable[[str | None], Awaitable[dict[str, Any]]]

LAUNCHERS: dict[str, Launcher] = {
    "hangman": start_hangman,
    "scramble": start_scramble,
    "trivia": start_trivia,
}


def shortcut(name: str) -> Callable[[str], Awaitable[dict[str, Any]]]:
    launcher = LAUNCHERS[name]

    async def handler(args: str) -> dict[str, Any]:
        parts = args.split()
        return await launcher(parts[0].lower() if parts else None)

    return handler


@registry.command(
    "play",
    "See the games, or start one",
    "/play [hangman|trivia|scramble]",
    aliases=("game", "games"),
)
async def play_command(args: str) -> dict[str, Any]:
    parts = args.split()
    if not parts:
        return {"type": "games", "data": CATALOG}
    name = parts[0].lower()
    launcher = LAUNCHERS.get(name)
    if launcher is None:
        return failure(f'No game called "{name}". Available: {", ".join(LAUNCHERS)}')
    return await launcher(parts[1].lower() if len(parts) > 1 else None)


registry.command(
    "hangman", "Start a game of hangman", "/hangman [category]", aliases=("hm",)
)(shortcut("hangman"))

registry.command(
    "scramble", "Unscramble the word", "/scramble [category]", aliases=("sc",)
)(shortcut("scramble"))

registry.command(
    "trivia", "Ten trivia questions", "/trivia [category]", aliases=("quiz",)
)(shortcut("trivia"))