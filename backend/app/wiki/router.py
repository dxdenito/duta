from fastapi import APIRouter, HTTPException, Query

from app.wiki import service

router = APIRouter(prefix="/api/wiki", tags=["wiki"])


async def respond(coro):
    try:
        return await coro
    except service.ArticleNotFound:
        raise HTTPException(status_code=404, detail="No Wikipedia article found for that.")
    except service.WikiUnavailable:
        raise HTTPException(status_code=503, detail="Wikipedia is unreachable right now.")


@router.get("/lookup")
async def lookup(q: str = Query(..., min_length=1, max_length=200)):
    return await respond(service.lookup(q))


@router.get("/article")
async def article(title: str = Query(..., min_length=1, max_length=200)):
    return await respond(service.article(title))


@router.get("/random")
async def random_article():
    return await respond(service.random_article())


@router.get("/suggest")
async def suggest(q: str = Query(..., max_length=100)):
    return await respond(service.suggest(q))