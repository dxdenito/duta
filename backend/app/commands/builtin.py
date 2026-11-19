from typing import Any

from app.commands.registry import registry


@registry.command("help", "List all available commands", "/help", aliases=("h", "?"))
async def help_command(args: str) -> dict[str, Any]:
    items = [
        {
            "name": c.name,
            "description": c.description,
            "usage": c.usage,
            "aliases": list(c.aliases),
        }
        for c in registry.commands
    ]
    return {"type": "help", "data": items}


@registry.command("ping", "Check that Duta is responding", "/ping")
async def ping_command(args: str) -> dict[str, Any]:
    return {"type": "text", "data": {"message": "pong"}}