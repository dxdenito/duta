from fastapi import APIRouter, HTTPException, Path, Query, Request
from fastapi.responses import StreamingResponse

from app.sports import service
from app.sports.leagues import DEFAULT_LEAGUE
from app.sports.stream import match_events

router = APIRouter(prefix="/api/sports", tags=["sports"])

EVENT_PATTERN = r"^\d{1,12}$"


async def respond(coro):
    try:
        return await coro
    except service.UnknownLeague:
        raise HTTPException(status_code=404, detail="Unknown league")
    except service.MatchNotFound:
        raise HTTPException(status_code=404, detail="Match not found")
    except service.SportsUnavailable:
        raise HTTPException(status_code=503, detail="Live scores are unavailable right now")


@router.get("/leagues")
async def leagues():
    return service.league_list()


@router.get("/scores")
async def scores(league: str = Query(DEFAULT_LEAGUE, max_length=30)):
    return await respond(service.scores_payload(league))


@router.get("/live")
async def live():
    return await respond(service.live_payload())


@router.get("/check")
async def check():
    return await service.check()


@router.get("/match/{league}/{event_id}")
async def match(
    league: str = Path(..., max_length=30),
    event_id: str = Path(..., pattern=EVENT_PATTERN),
):
    return await respond(service.get_match(league, event_id))


@router.get("/match/{league}/{event_id}/stream")
async def stream(
    request: Request,
    league: str = Path(..., max_length=30),
    event_id: str = Path(..., pattern=EVENT_PATTERN),
    after: int = Query(0, ge=0),
):
    try:
        service.require_league(league)
    except service.UnknownLeague:
        raise HTTPException(status_code=404, detail="Unknown league")

    header = request.headers.get("last-event-id", "")
    last = max(after, int(header)) if header.isdigit() else after

    return StreamingResponse(
        match_events(request, league, event_id, last),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


