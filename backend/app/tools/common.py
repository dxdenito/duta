from typing import Any, Awaitable, Callable

import httpx

from app.cache import AsyncTTLCache


class ToolError(Exception):
    status = 400

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class BadInput(ToolError):
    status = 400


class NotFound(ToolError):
    status = 404


class Unavailable(ToolError):
    status = 503


async def cached(
    cache: AsyncTTLCache,
    key: str,
    loader: Callable[[], Awaitable[Any]],
    what: str,
) -> Any:
    try:
        return await cache.get_or_load(key, loader)
    except (httpx.HTTPError, RuntimeError) as exc:
        raise Unavailable(f"{what} is unavailable right now. Please try again shortly.") from exc