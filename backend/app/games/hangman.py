import random
from dataclasses import dataclass, field
from typing import Any

from app.games.store import GameStore
from app.games.words import CATEGORY_IDS, WORDS

MAX_WRONG = 6

store = GameStore(ttl=3600.0, max_size=5000)


class UnknownCategory(Exception):
    pass


class GameNotFound(Exception):
    pass


@dataclass(slots=True)
class Hangman:
    word: str
    category: str
    remaining: set[str]
    guessed: set[str] = field(default_factory=set)
    missed: list[str] = field(default_factory=list)

    @property
    def status(self) -> str:
        if not self.remaining:
            return "won"
        if len(self.missed) >= MAX_WRONG:
            return "lost"
        return "playing"


def snapshot(game_id: str, game: Hangman) -> dict[str, Any]:
    status = game.status
    mask = [c if not c.isalpha() or c in game.guessed else None for c in game.word]
    return {
        "id": game_id,
        "category": game.category,
        "mask": mask,
        "guessed": sorted(game.guessed),
        "missed": list(game.missed),
        "wrong": len(game.missed),
        "max_wrong": MAX_WRONG,
        "status": status,
        "word": game.word if status != "playing" else None,
    }


def start(category: str | None) -> dict[str, Any]:
    chosen = (category or "").strip().lower() or random.choice(CATEGORY_IDS)
    words = WORDS.get(chosen)
    if words is None:
        raise UnknownCategory(chosen)
    word = random.choice(words)
    game = Hangman(
        word=word,
        category=chosen,
        remaining={c for c in word if c.isalpha()},
    )
    return snapshot(store.create(game), game)


def guess(game_id: str, letter: str) -> dict[str, Any]:
    game = store.get(game_id)
    if game is None:
        raise GameNotFound(game_id)
    letter = letter.lower()
    if game.status == "playing" and letter not in game.guessed:
        game.guessed.add(letter)
        if letter in game.remaining:
            game.remaining.discard(letter)
        else:
            game.missed.append(letter)
    return snapshot(game_id, game)