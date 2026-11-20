import random
from dataclasses import dataclass
from typing import Any

from app.games.errors import GameNotFound, InvalidChoice, UnknownCategory
from app.games.store import GameStore
from app.games.trivia_source import CATEGORIES, draw

ROUND_SIZE = 10
CATEGORY_IDS: tuple[str, ...] = tuple(CATEGORIES)

store = GameStore(ttl=3600.0, max_size=5000)


@dataclass(slots=True)
class Question:
    text: str
    options: list[str]
    answer: int


@dataclass(slots=True)
class Trivia:
    category: str
    questions: list[Question]
    index: int = 0
    score: int = 0

    @property
    def finished(self) -> bool:
        return self.index >= len(self.questions)


def build_question(raw: dict[str, Any]) -> Question:
    options = [*raw["wrong"], raw["correct"]]
    random.shuffle(options)
    return Question(raw["text"], options, options.index(raw["correct"]))


def view(game_id: str, game: Trivia) -> dict[str, Any]:
    question = None
    if not game.finished:
        current = game.questions[game.index]
        question = {"text": current.text, "options": current.options}
    return {
        "id": game_id,
        "category": game.category,
        "index": game.index,
        "total": len(game.questions),
        "score": game.score,
        "status": "finished" if game.finished else "playing",
        "question": question,
    }


async def start(category: str | None) -> dict[str, Any]:
    chosen = (category or "").strip().lower() or random.choice(CATEGORY_IDS)
    if chosen not in CATEGORIES:
        raise UnknownCategory(chosen)
    raws = await draw(chosen, ROUND_SIZE)
    game = Trivia(category=chosen, questions=[build_question(raw) for raw in raws])
    return view(store.create(game), game)


def answer(game_id: str, choice: int) -> dict[str, Any]:
    game = store.get(game_id)
    if game is None:
        raise GameNotFound(game_id)
    if game.finished:
        return {**view(game_id, game), "correct": None, "answer": None}
    question = game.questions[game.index]
    if choice >= len(question.options):
        raise InvalidChoice(choice)
    correct = choice == question.answer
    if correct:
        game.score += 1
    game.index += 1
    return {**view(game_id, game), "correct": correct, "answer": question.answer}