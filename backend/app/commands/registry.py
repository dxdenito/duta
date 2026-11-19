import logging
from dataclasses import dataclass
from difflib import get_close_matches
from typing import Any, Awaitable, Callable

logger = logging.getLogger("duta.commands")

Handler = Callable[[str], Awaitable[dict[str, Any]]]


@dataclass(frozen=True, slots=True)
class Command:
    name: str
    description: str
    usage: str
    handler: Handler
    aliases: tuple[str, ...] = ()


class Registry:
    def __init__(self) -> None:
        self.commands: list[Command] = []
        self.lookup: dict[str, Command] = {}
        self.fallback: Handler | None = None

    def command(
        self,
        name: str,
        description: str,
        usage: str,
        aliases: tuple[str, ...] = (),
    ) -> Callable[[Handler], Handler]:
        def decorator(handler: Handler) -> Handler:
            cmd = Command(name, description, usage, handler, aliases)
            for key in (name, *aliases):
                if key in self.lookup:
                    raise ValueError(f"Duplicate command key: {key}")
                self.lookup[key] = cmd
            self.commands.append(cmd)
            return handler

        return decorator

    def set_fallback(self, handler: Handler) -> Handler:
        self.fallback = handler
        return handler

    @staticmethod
    def parse(text: str) -> tuple[str | None, str]:
        text = text.strip()
        if not text.startswith("/"):
            return None, text
        name, _, args = text[1:].partition(" ")
        return name.lower(), args.strip()

    async def execute(self, text: str) -> dict[str, Any]:
        name, args = self.parse(text)

        if name is None:
            if not args:
                return self._error("", "Type a command or a question. Try /help")
            if self.fallback is None:
                return self._error("", "No default handler configured")
            return await self._run("", self.fallback, args)

        cmd = self.lookup.get(name)
        if cmd is None:
            suggestions = get_close_matches(name, self.lookup.keys(), n=3, cutoff=0.5)
            message = f"Unknown command /{name}."
            if suggestions:
                message += " Did you mean " + ", ".join(f"/{s}" for s in suggestions) + "?"
            return self._error(name, message)

        return await self._run(cmd.name, cmd.handler, args)

    async def _run(self, name: str, handler: Handler, args: str) -> dict[str, Any]:
        try:
            result = await handler(args)
        except Exception:
            logger.exception("Command failed: %s", name)
            return self._error(name, "Something went wrong. Please try again.")
        return {"type": result["type"], "command": name, "data": result.get("data")}

    @staticmethod
    def _error(name: str, message: str) -> dict[str, Any]:
        return {"type": "error", "command": name, "data": {"message": message}}


registry = Registry()