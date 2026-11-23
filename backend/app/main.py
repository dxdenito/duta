import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.commands import registry
from app.http import close_client
from app.news.router import router as news_router
from app.schemas import CommandRequest, CommandResponse
from app.wiki.router import router as wiki_router
from app.games.router import router as games_router
from app.sports.router import router as sports_router
from app.tools.router import router as tools_router

PRIVATE_ORIGIN_REGEX = (
    r"^https?://("
    r"localhost|127\.0\.0\.1"
    r"|10\.\d{1,3}\.\d{1,3}\.\d{1,3}"
    r"|192\.168\.\d{1,3}\.\d{1,3}"
    r"|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?$"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_client()


app = FastAPI(title="Duta API", version="0.3.0", lifespan=lifespan)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173",
        "https://duta-frontend.onrender.com"
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(news_router)
app.include_router(wiki_router)
app.include_router(games_router)
app.include_router(sports_router)
app.include_router(tools_router)

@app.get("/api/health")
def health():
    return {"status": "online", "message": "Duta is ready to help!"}

@app.get("/api/commands")
async def list_commands():
    return [
        {
            "name": command.name,
            "description": command.description,
            "usage": command.usage,
            "aliases": list(command.aliases),
        }
        for command in registry.commands
    ]

@app.post("/api/command", response_model=CommandResponse)
async def run_command(payload: CommandRequest):
    return await registry.execute(payload.input)