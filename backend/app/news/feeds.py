from dataclasses import dataclass
from urllib.parse import quote_plus

GN = "https://news.google.com/rss"
LOCAL_EDITION = "hl=en-KE&gl=KE&ceid=KE:en"
GLOBAL_EDITION = "hl=en-US&gl=US&ceid=US:en"


@dataclass(frozen=True, slots=True)
class Feed:
    name: str
    url: str
    aggregator: bool = False


@dataclass(frozen=True, slots=True)
class Section:
    label: str
    feeds: tuple[Feed, ...]
    limit: int = 8


@dataclass(frozen=True, slots=True)
class Category:
    id: str
    label: str
    icon: str
    sections: tuple[Section, ...]


def gn_topic(topic: str, local: bool = True) -> Feed:
    edition = LOCAL_EDITION if local else GLOBAL_EDITION
    scope = "KE" if local else "Global"
    return Feed(
        f"Google News {topic.title()} ({scope})",
        f"{GN}/headlines/section/topic/{topic}?{edition}",
        True,
    )


def gn_search(query: str, local: bool = True, days: int = 3) -> Feed:
    edition = LOCAL_EDITION if local else GLOBAL_EDITION
    q = quote_plus(f"{query} when:{days}d")
    return Feed(f"Google News: {query}", f"{GN}/search?q={q}&{edition}", True)


KENYA_GENERAL = (
    gn_topic("NATION"),
    Feed("Kenyans.co.ke", "https://www.kenyans.co.ke/feeds/news"),
    Feed("KBC", "https://www.kbc.co.ke/feed/"),
    Feed("Nation", "https://nation.africa/kenya/rss.xml"),
    Feed("People Daily", "https://www.peopledaily.digital/feed"),
    Feed("Capital FM", "https://www.capitalfm.co.ke/news/feed/"),
)

BBC_WORLD = Feed("BBC World", "https://feeds.bbci.co.uk/news/world/rss.xml")
BBC_AFRICA = Feed("BBC Africa", "https://feeds.bbci.co.uk/news/world/africa/rss.xml")
AL_JAZEERA = Feed("Al Jazeera", "https://www.aljazeera.com/xml/rss/all.xml")
BBC_SPORT = Feed("BBC Sport", "https://feeds.bbci.co.uk/sport/rss.xml")
BBC_TECH = Feed("BBC Tech", "https://feeds.bbci.co.uk/news/technology/rss.xml")

_ALL = (
    Category(
        "top",
        "Top",
        "Newspaper",
        (Section("Kenya", KENYA_GENERAL, 12),),
    ),
    Category(
        "politics",
        "Politics",
        "Landmark",
        (
            Section(
                "Kenya",
                (
                    gn_search("Kenya politics"),
                    gn_search("Kenya parliament senate county governors"),
                ),
            ),
            Section(
                "World",
                (
                    gn_search("world politics", local=False, days=2),
                    gn_search("international relations diplomacy elections", local=False, days=2),
                ),
            ),
        ),
    ),
    Category(
        "business",
        "Business",
        "TrendingUp",
        (
            Section(
                "Kenya business",
                (
                    gn_topic("BUSINESS"),
                    gn_search("Kenya business economy"),
                    gn_search("Kenya banks companies earnings"),
                ),
            ),
            Section(
                "NSE & Kenya stocks",
                (
                    gn_search("Nairobi Securities Exchange NSE", days=7),
                    gn_search("NSE Kenya stocks shares Safaricom", days=7),
                ),
            ),
            Section(
                "Global markets",
                (
                    gn_search("stock markets Wall Street", local=False, days=1),
                    gn_topic("BUSINESS", local=False),
                ),
                6,
            ),
        ),
    ),
    Category(
        "world",
        "World",
        "Globe",
        (
            Section("Africa", (BBC_AFRICA, gn_search("East Africa Africa news", days=2))),
            Section("World", (BBC_WORLD, AL_JAZEERA, gn_topic("WORLD", local=False)), 10),
        ),
    ),
    Category(
        "sports",
        "Sports",
        "Trophy",
        (
            Section(
                "Kenya",
                (gn_topic("SPORTS"), gn_search("Kenya football athletics rugby")),
            ),
            Section("World", (BBC_SPORT, gn_topic("SPORTS", local=False))),
        ),
    ),
    Category(
        "tech",
        "Tech",
        "Cpu",
        (
            Section("Kenya & Africa", (gn_search("Kenya technology startups fintech", days=7),)),
            Section("Global", (BBC_TECH, gn_topic("TECHNOLOGY", local=False))),
        ),
    ),
)

CATEGORIES: dict[str, Category] = {c.id: c for c in _ALL}

TABS: list[dict[str, str]] = [
    {"id": c.id, "label": c.label, "icon": c.icon} for c in CATEGORIES.values()
]

CATEGORY_ALIASES: dict[str, str] = {
    "home": "top",
    "headlines": "top",
    "politic": "politics",
    "biz": "business",
    "money": "business",
    "markets": "business",
    "global": "world",
    "international": "world",
    "sport": "sports",
    "technology": "tech",
}


def resolve_category(args: str) -> str | None:
    parts = args.split(maxsplit=1)
    key = parts[0].lower() if parts else "top"
    key = CATEGORY_ALIASES.get(key, key)
    return key if key in CATEGORIES else None