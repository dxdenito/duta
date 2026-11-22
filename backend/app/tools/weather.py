from typing import Any

from app.cache import AsyncTTLCache
from app.http import get_client
from app.tools.common import BadInput, NotFound, cached

GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
DEFAULT_PLACE = "Nairobi"
CURRENT = "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day"
DAILY = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"

geo_cache = AsyncTTLCache(ttl=86400, max_size=500, fail_ttl=30)
forecast_cache = AsyncTTLCache(ttl=600, max_size=500, fail_ttl=30)

CODES: dict[int, tuple[str, str, str]] = {}

for _codes, _label, _day, _night in (
    ((0,), "Clear sky", "Sun", "Moon"),
    ((1,), "Mainly clear", "Sun", "Moon"),
    ((2,), "Partly cloudy", "CloudSun", "CloudMoon"),
    ((3,), "Overcast", "Cloud", "Cloud"),
    ((45, 48), "Fog", "CloudFog", "CloudFog"),
    ((51, 53, 55), "Drizzle", "CloudDrizzle", "CloudDrizzle"),
    ((56, 57), "Freezing drizzle", "CloudDrizzle", "CloudDrizzle"),
    ((61, 63, 65), "Rain", "CloudRain", "CloudRain"),
    ((66, 67), "Freezing rain", "CloudRain", "CloudRain"),
    ((71, 73, 75, 77), "Snow", "CloudSnow", "CloudSnow"),
    ((80, 81, 82), "Rain showers", "CloudRain", "CloudRain"),
    ((85, 86), "Snow showers", "CloudSnow", "CloudSnow"),
    ((95,), "Thunderstorm", "CloudLightning", "CloudLightning"),
    ((96, 99), "Thunderstorm with hail", "CloudLightning", "CloudLightning"),
):
    for _code in _codes:
        CODES[_code] = (_label, _day, _night)


def describe(code: Any, is_day: bool) -> dict[str, str]:
    label, day_icon, night_icon = CODES.get(code, ("Unknown", "Cloud", "Cloud"))
    return {"label": label, "icon": day_icon if is_day else night_icon}


def rounded(value: Any) -> int | None:
    return None if value is None else round(value)


def shape_place(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": item.get("name", ""),
        "region": item.get("admin1") or "",
        "country": item.get("country") or "",
        "lat": item["latitude"],
        "lon": item["longitude"],
    }


async def fetch_place(name: str, hint: str) -> dict[str, Any] | None:
    response = await get_client().get(
        GEO_URL,
        params={"name": name, "count": 10 if hint else 1, "language": "en", "format": "json"},
    )
    response.raise_for_status()
    results = response.json().get("results") or []
    if not results:
        return None
    if hint:
        for item in results:
            haystack = " ".join(
                str(item.get(key, "")) for key in ("country", "country_code", "admin1")
            ).lower()
            if hint in haystack:
                return shape_place(item)
    return shape_place(results[0])


async def fetch_forecast(lat: float, lon: float) -> dict[str, Any]:
    response = await get_client().get(
        FORECAST_URL,
        params={
            "latitude": lat,
            "longitude": lon,
            "current": CURRENT,
            "daily": DAILY,
            "timezone": "auto",
            "forecast_days": 5,
        },
    )
    response.raise_for_status()
    return response.json()


def build(place: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    current = data.get("current") or {}
    daily = data.get("daily") or {}
    days = [
        {
            "date": date,
            "high": rounded(high),
            "low": rounded(low),
            "rain": rain,
            **describe(code, True),
        }
        for date, code, high, low, rain in zip(
            daily.get("time", []),
            daily.get("weather_code", []),
            daily.get("temperature_2m_max", []),
            daily.get("temperature_2m_min", []),
            daily.get("precipitation_probability_max", []),
        )
    ]
    return {
        "place": {k: place[k] for k in ("name", "region", "country")},
        "current": {
            "temp": rounded(current.get("temperature_2m")),
            "feels": rounded(current.get("apparent_temperature")),
            "humidity": current.get("relative_humidity_2m"),
            "wind": rounded(current.get("wind_speed_10m")),
            **describe(current.get("weather_code"), bool(current.get("is_day", 1))),
        },
        "days": days,
    }


async def weather(text: str) -> dict[str, Any]:
    query = " ".join(text.split()) or DEFAULT_PLACE
    if len(query) > 80:
        raise BadInput("That place name is too long.")
    name, _, hint = query.partition(",")
    name = name.strip()
    hint = hint.strip().lower()
    if not name:
        raise BadInput("Please enter a place name.")

    place = await cached(
        geo_cache, query.lower(), lambda: fetch_place(name, hint), "The weather service"
    )
    if place is None:
        raise NotFound(f'Could not find a place called "{name}".')

    data = await cached(
        forecast_cache,
        f"{place['lat']:.2f},{place['lon']:.2f}",
        lambda: fetch_forecast(place["lat"], place["lon"]),
        "The weather service",
    )
    return build(place, data)