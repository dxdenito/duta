from fastapi import APIRouter, HTTPException, Query

from app.tools import convert, define, jokes, weather
from app.tools.common import ToolError

router = APIRouter(prefix="/api/tools", tags=["tools"])


async def respond(coro):
    try:
        return await coro
    except ToolError as exc:
        raise HTTPException(status_code=exc.status, detail=exc.message)


@router.get("/define")
async def read_define(word: str = Query(..., min_length=1, max_length=40)):
    return await respond(define.define(word))


@router.get("/weather")
async def read_weather(place: str = Query("", max_length=80)):
    return await respond(weather.weather(place))


@router.get("/convert")
async def read_convert(q: str = Query(..., min_length=1, max_length=100)):
    return await respond(convert.convert(q))


@router.get("/joke")
async def read_joke(exclude: int = Query(-1, ge=-1)):
    return jokes.pick(exclude)