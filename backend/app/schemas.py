from typing import Any

from pydantic import BaseModel, Field


class CommandRequest(BaseModel):
    input: str = Field(min_length=1, max_length=500)


class CommandResponse(BaseModel):
    type: str
    command: str
    data: Any = None