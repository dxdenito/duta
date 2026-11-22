from typing import Any, Awaitable

from app.commands.registry import registry
from app.tools import convert, define, jokes, weather
from app.tools.common import ToolError

CONVERT_HELP = (
    "Try /convert 100 usd to kes, /convert 5 km to miles, /convert 72 f to c or /convert 2 kg to lb"
)


def failure(message: str) -> dict[str, Any]:
    return {"type": "error", "data": {"message": message}}


async def envelope(kind: str, task: Awaitable[Any]) -> dict[str, Any]:
    try:
        data = await task
    except ToolError as exc:
        return failure(exc.message)
    return {"type": kind, "data": data}


@registry.command("define", "Meaning of a word", "/define <word>", aliases=("def", "dict"))
async def define_command(args: str) -> dict[str, Any]:
    if not args.strip():
        return failure("Which word? Try /define serendipity")
    return await envelope("define", define.define(args))


@registry.command("weather", "Weather and 5-day forecast", "/weather [place]", aliases=("forecast",))
async def weather_command(args: str) -> dict[str, Any]:
    return await envelope("weather", weather.weather(args))


@registry.command(
    "convert",
    "Convert units and currencies (KES included)",
    "/convert 100 usd to kes",
    aliases=("conv", "currency"),
)
async def convert_command(args: str) -> dict[str, Any]:
    if not args.strip():
        return {"type": "text", "data": {"message": CONVERT_HELP}}
    return await envelope("convert", convert.convert(args))


@registry.command("joke", "A random joke", "/joke", aliases=("jokes",))
async def joke_command(args: str) -> dict[str, Any]:
    return {"type": "joke", "data": jokes.pick(-1)}