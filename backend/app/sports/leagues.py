from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class League:
    id: str
    name: str
    region: str


LEAGUES: tuple[League, ...] = (
    League("ken.1", "Kenyan Premier League", "Kenya"),
    League("caf.nations", "Africa Cup of Nations", "Africa"),
    League("caf.champions", "CAF Champions League", "Africa"),
    League("eng.1", "Premier League", "England"),
    League("uefa.champions", "Champions League", "Europe"),
    League("esp.1", "LaLiga", "Spain"),
    League("ger.1", "Bundesliga", "Germany"),
    League("ita.1", "Serie A", "Italy"),
    League("fra.1", "Ligue 1", "France"),
)

LEAGUE_MAP: dict[str, League] = {league.id: league for league in LEAGUES}

DEFAULT_LEAGUE = "ken.1"

ALIASES: dict[str, str] = {
    "kpl": "ken.1",
    "afcon": "caf.nations",
    "caf": "caf.champions",
    "epl": "eng.1",
    "pl": "eng.1",
    "ucl": "uefa.champions",
    "laliga": "esp.1",
    "bundesliga": "ger.1",
    "seriea": "ita.1",
    "ligue1": "fra.1",
}


def resolve_league(text: str) -> str | None:
    parts = text.split(maxsplit=1)
    key = parts[0].lower() if parts else DEFAULT_LEAGUE
    key = ALIASES.get(key, key)
    return key if key in LEAGUE_MAP else None