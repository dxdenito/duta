from fastapi import APIRouter, HTTPException, Path, Query
from pydantic import BaseModel, Field

from app.games import hangman, scramble, trivia
from app.games.catalog import CATALOG
from app.games.errors import GameNotFound, InvalidChoice, UnknownCategory
from app.games.trivia_source import TriviaUnavailable
from app.games.words import CATEGORY_IDS

router = APIRouter(prefix="/api/games", tags=["games"])

NOT_FOUND = "Game not found or expired. Start a new one."


class GuessRequest(BaseModel):
    letter: str = Field(pattern=r"^[A-Za-z]$")


class AnswerRequest(BaseModel):
    answer: str = Field(min_length=1, max_length=40)


class ChoiceRequest(BaseModel):
    choice: int = Field(ge=0, le=3)


def bad_category(options: tuple[str, ...]) -> HTTPException:
    return HTTPException(status_code=400, detail=f"Unknown category. Try: {', '.join(options)}")


@router.get("")
async def list_games():
    return CATALOG


@router.post("/hangman")
async def new_hangman(category: str = Query("", max_length=20)):
    try:
        return hangman.start(category)
    except hangman.UnknownCategory:
        raise bad_category(CATEGORY_IDS)


@router.post("/hangman/{game_id}/guess")
async def guess_hangman(payload: GuessRequest, game_id: str = Path(..., max_length=32)):
    try:
        return hangman.guess(game_id, payload.letter)
    except hangman.GameNotFound:
        raise HTTPException(status_code=404, detail=NOT_FOUND)


@router.post("/scramble")
async def new_scramble(category: str = Query("", max_length=20)):
    try:
        return scramble.start(category)
    except UnknownCategory:
        raise bad_category(CATEGORY_IDS)


@router.post("/scramble/{game_id}/answer")
async def answer_scramble(payload: AnswerRequest, game_id: str = Path(..., max_length=32)):
    try:
        return scramble.answer(game_id, payload.answer)
    except GameNotFound:
        raise HTTPException(status_code=404, detail=NOT_FOUND)


@router.post("/scramble/{game_id}/hint")
async def hint_scramble(game_id: str = Path(..., max_length=32)):
    try:
        return scramble.hint(game_id)
    except GameNotFound:
        raise HTTPException(status_code=404, detail=NOT_FOUND)


@router.post("/scramble/{game_id}/giveup")
async def give_up_scramble(game_id: str = Path(..., max_length=32)):
    try:
        return scramble.give_up(game_id)
    except GameNotFound:
        raise HTTPException(status_code=404, detail=NOT_FOUND)


@router.post("/trivia")
async def new_trivia(category: str = Query("", max_length=20)):
    try:
        return await trivia.start(category)
    except UnknownCategory:
        raise bad_category(trivia.CATEGORY_IDS)
    except TriviaUnavailable:
        raise HTTPException(
            status_code=503,
            detail="Trivia questions are unavailable right now. Try Kenya trivia or try again shortly.",
        )


@router.post("/trivia/{game_id}/answer")
async def answer_trivia(payload: ChoiceRequest, game_id: str = Path(..., max_length=32)):
    try:
        return trivia.answer(game_id, payload.choice)
    except GameNotFound:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    except InvalidChoice:
        raise HTTPException(status_code=400, detail="Invalid choice")