import math
import re
from datetime import datetime, timezone
from typing import Any

from app.cache import AsyncTTLCache
from app.http import get_client
from app.tools.common import BadInput, cached

RATES_URL = "https://open.er-api.com/v6/latest/USD"
SOURCE_URL = "https://www.exchangerate-api.com"

PATTERN = re.compile(
    r"^\s*(?P<amount>[-+]?(?:\d[\d,]*\.?\d*|\.\d+))\s*"
    r"(?P<src>[A-Za-z°][A-Za-z0-9°/²³]*)\s+(?:to|in|into|as)\s+"
    r"(?P<dst>[A-Za-z°][A-Za-z0-9°/²³]*)\s*$",
    re.IGNORECASE,
)

CURRENCY_ALIASES = {"ksh": "KES", "kshs": "KES", "shilling": "KES", "shillings": "KES"}

rates_cache = AsyncTTLCache(ttl=6 * 3600, max_size=4, fail_ttl=60)

UNITS: dict[str, tuple[str, float, str, str]] = {}


def register(category: str, factor: float, label: str, *aliases: str, show: str | None = None) -> None:
    for name in (label, *aliases):
        UNITS[name] = (category, factor, label, show or label)


register("length", 1.0, "m", "meter", "meters", "metre", "metres")
register("length", 1000.0, "km", "kilometer", "kilometers", "kilometre", "kilometres")
register("length", 0.01, "cm", "centimeter", "centimeters", "centimetre", "centimetres")
register("length", 0.001, "mm", "millimeter", "millimeters", "millimetre", "millimetres")
register("length", 1609.344, "mi", "mile", "miles")
register("length", 0.9144, "yd", "yard", "yards", "yds")
register("length", 0.3048, "ft", "foot", "feet")
register("length", 0.0254, "inch", "inches")
register("mass", 1.0, "kg", "kilogram", "kilograms", "kilo", "kilos")
register("mass", 0.001, "g", "gram", "grams")
register("mass", 0.000001, "mg", "milligram", "milligrams")
register("mass", 0.45359237, "lb", "lbs", "pound", "pounds")
register("mass", 0.028349523125, "oz", "ounce", "ounces")
register("mass", 1000.0, "t", "tonne", "tonnes")
register("volume", 1.0, "l", "liter", "liters", "litre", "litres")
register("volume", 0.001, "ml", "milliliter", "milliliters", "millilitre", "millilitres")
register("volume", 3.785411784, "gal", "gallon", "gallons")
register("volume", 0.946352946, "qt", "quart", "quarts")
register("volume", 0.473176473, "pt", "pint", "pints")
register("volume", 0.2365882365, "cup", "cups")
register("volume", 0.0295735295625, "floz")
register("volume", 0.01478676478125, "tbsp", "tablespoon", "tablespoons")
register("volume", 0.00492892159375, "tsp", "teaspoon", "teaspoons")
register("speed", 1.0, "m/s", "mps")
register("speed", 1000 / 3600, "km/h", "kph", "kmh", "kmph")
register("speed", 0.44704, "mph")
register("speed", 1852 / 3600, "knot", "knots", "kn", "kt")
register("area", 1.0, "m²", "m2", "sqm")
register("area", 1_000_000.0, "km²", "km2", "sqkm")
register("area", 10_000.0, "ha", "hectare", "hectares")
register("area", 4046.8564224, "acre", "acres")
register("area", 0.09290304, "ft²", "ft2", "sqft")
register("time", 1.0, "s", "sec", "secs", "second", "seconds")
register("time", 60.0, "min", "mins", "minute", "minutes")
register("time", 3600.0, "h", "hr", "hrs", "hour", "hours")
register("time", 86400.0, "day", "days", "d")
register("time", 604800.0, "week", "weeks", "wk")
register("temperature", 1.0, "c", "celsius", show="°C")
register("temperature", 1.0, "f", "fahrenheit", show="°F")
register("temperature", 1.0, "k", "kelvin", show="K")


def format_number(value: float) -> str:
    magnitude = abs(value)
    if magnitude == 0:
        return "0"
    if magnitude >= 1e15 or magnitude < 1:
        return f"{value:.6g}"
    return f"{value:,.4f}".rstrip("0").rstrip(".")


def normalize(token: str) -> str:
    return token.lower().replace("°", "")


def to_celsius(key: str, value: float) -> float:
    if key == "f":
        return (value - 32) * 5 / 9
    if key == "k":
        return value - 273.15
    return value


def from_celsius(key: str, value: float) -> float:
    if key == "f":
        return value * 9 / 5 + 32
    if key == "k":
        return value + 273.15
    return value


def currency_code(key: str) -> str | None:
    alias = CURRENCY_ALIASES.get(key)
    if alias:
        return alias
    if len(key) == 3 and key.isalpha() and key not in UNITS:
        return key.upper()
    return None


def convert_units(amount: float, src: str, dst: str) -> dict[str, Any]:
    left = UNITS.get(src)
    right = UNITS.get(dst)
    if left is None:
        raise BadInput(f'Unknown unit "{src}".')
    if right is None:
        raise BadInput(f'Unknown unit "{dst}".')
    if left[0] != right[0]:
        raise BadInput(f"Cannot convert {left[0]} to {right[0]}.")

    if left[0] == "temperature":
        value = from_celsius(right[2], to_celsius(left[2], amount))
    else:
        value = amount * left[1] / right[1]

    return {
        "kind": "units",
        "from_text": f"{format_number(amount)} {left[3]}",
        "to_text": f"{format_number(value)} {right[3]}",
        "value": value,
    }


async def fetch_rates() -> dict[str, Any]:
    response = await get_client().get(RATES_URL)
    response.raise_for_status()
    data = response.json()
    rates = data.get("rates") or data.get("conversion_rates")
    if data.get("result") != "success" or not rates:
        raise RuntimeError("Unexpected exchange rate response")
    stamp = data.get("time_last_update_unix")
    updated = datetime.fromtimestamp(stamp, tz=timezone.utc).isoformat() if stamp else None
    return {"rates": rates, "updated": updated}


async def convert_currency(amount: float, src: str, dst: str) -> dict[str, Any]:
    data = await cached(rates_cache, "USD", fetch_rates, "The exchange rate service")
    rates = data["rates"]
    if src not in rates:
        raise BadInput(f"Unknown currency {src}.")
    if dst not in rates:
        raise BadInput(f"Unknown currency {dst}.")
    rate = rates[dst] / rates[src]
    value = amount * rate
    return {
        "kind": "currency",
        "from_text": f"{format_number(amount)} {src}",
        "to_text": f"{format_number(value)} {dst}",
        "rate_text": f"1 {src} = {format_number(rate)} {dst}",
        "updated": data["updated"],
        "source": "ExchangeRate-API",
        "source_url": SOURCE_URL,
        "value": value,
    }


async def convert(query: str) -> dict[str, Any]:
    match = PATTERN.match(query)
    if match is None:
        raise BadInput("Try something like: 100 usd to kes, 5 km to miles, 72 f to c")
    try:
        amount = float(match["amount"].replace(",", ""))
    except ValueError:
        raise BadInput("That amount is not a number.")
    if not math.isfinite(amount) or abs(amount) > 1e15:
        raise BadInput("That amount is out of range.")

    src = normalize(match["src"])
    dst = normalize(match["dst"])
    src_code = currency_code(src)
    dst_code = currency_code(dst)
    if src_code and dst_code:
        return await convert_currency(amount, src_code, dst_code)
    return convert_units(amount, src, dst)