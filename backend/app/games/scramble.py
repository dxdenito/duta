import random
from dataclasses import dataclass
from typing import Any

from app.games.errors import GameNotFound, UnknownCategory
from app.games.store import GameStore
from app.games.words import CATEGORY_IDS, WORDS

MAX_HINTS = 2

store = GameStore(ttl=3600.0, max_size=5000)

POOLS: dict[str, tuple[str, ...]] = {
    category: tuple(word for word in words if " " not in word and len(word) >= 4)
    for category, words in WORDS.items()
}


@dataclass(slots=True)
class Scramble:
    word: str
    scrambled: str
    category: str
    attempts: int = 0
    hints: int = 0
    status: str = "playing"


def shuffle_word(word: str) -> str:
    letters = list(word)
    for _ in range(10):
        random.shuffle(letters)
        candidate = "".join(letters)
        if candidate != word:
            return candidate
    return word[1:] + word[0]


def snapshot(game_id: str, game: Scramble) -> dict[str, Any]:
    return {
        "id": game_id,
        "category": game.category,
        "scrambled": game.scrambled,
        "length": len(game.word),
        "attempts": game.attempts,
        "hints": game.hints,
        "max_hints": MAX_HINTS,
        "prefix": game.word[: game.hints],
        "status": game.status,
        "word": game.word if game.status != "playing" else None,
    }


def fetch(game_id: str) -> Scramble:
    game = store.get(game_id)
    if game is None:
        raise GameNotFound(game_id)
    return game


def start(category: str | None) -> dict[str, Any]:
    chosen = (category or "").strip().lower() or random.choice(CATEGORY_IDS)
    pool = POOLS.get(chosen)
    if not pool:
        raise UnknownCategory(chosen)
    word = random.choice(pool)
    game = Scramble(word=word, scrambled=shuffle_word(word), category=chosen)
    return snapshot(store.create(game), game)


def answer(game_id: str, text: str) -> dict[str, Any]:
    game = fetch(game_id)
    correct = False
    if game.status == "playing":
        game.attempts += 1
        if "".join(text.lower().split()) == game.word:
            game.status = "solved"
            correct = True
    return {**snapshot(game_id, game), "correct": correct}


def hint(game_id: str) -> dict[str, Any]:
    game = fetch(game_id)
    if game.status == "playing" and game.hints < MAX_HINTS:
        game.hints += 1
    return snapshot(game_id, game)


def give_up(game_id: str) -> dict[str, Any]:
    game = fetch(game_id)
    if game.status == "playing":
        game.status = "revealed"
    return snapshot(game_id, game)