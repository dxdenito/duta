from fastapi import APIRouter, HTTPException, Query

from app.news.service import NewsUnavailable, UnknownCategory, feed_status, get_news

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get("")
async def read_news(category: str = Query("top", max_length=30)):
    try:
        return await get_news(category.lower())
    except UnknownCategory:
        raise HTTPException(status_code=404, detail="Unknown category")
    except NewsUnavailable:
        raise HTTPException(status_code=503, detail="News is unavailable right now")


@router.get("/status")
async def read_status():
    return await feed_status()