"""Round contracts mirror the mobile score rules without coercing score values."""
from datetime import datetime, timezone
from typing import Annotated, Literal
from uuid import UUID
import unicodedata

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StrictInt, field_validator, model_validator


class HoleInput(BaseModel):
    model_config = ConfigDict(extra='forbid', hide_input_in_errors=True)
    number: Annotated[StrictInt, Field(ge=1, le=18)]
    par: Annotated[StrictInt, Field(ge=1, le=6)]
    strokes: Annotated[StrictInt, Field(ge=1, le=30)]
    putts: Annotated[StrictInt, Field(ge=0, le=30)]

    @model_validator(mode='after')
    def consistent_putts(self):
        if self.putts > self.strokes:
            raise ValueError('Putts cannot exceed strokes.')
        return self


class RoundCreate(BaseModel):
    model_config = ConfigDict(extra='forbid', hide_input_in_errors=True)
    submission_id: UUID
    course_name: str
    planned_holes: Annotated[StrictInt, Field(ge=9, le=18)]
    completed_at: AwareDatetime
    holes: Annotated[list[HoleInput], Field(min_length=1, max_length=18)]

    @field_validator('course_name')
    @classmethod
    def valid_course(cls, value: str) -> str:
        value = value.strip()
        if not 1 <= len(value) <= 100 or any(unicodedata.category(c).startswith('C') for c in value):
            raise ValueError('Invalid course name.')
        return value

    @field_validator('completed_at', mode='before')
    @classmethod
    def explicit_timestamp(cls, value):
        if not isinstance(value, (str, datetime)):
            raise ValueError('Use an ISO timestamp with a timezone.')
        return value

    @field_validator('completed_at')
    @classmethod
    def utc_timestamp(cls, value: datetime) -> datetime:
        return value.astimezone(timezone.utc)

    @model_validator(mode='after')
    def consistent_holes(self):
        if self.planned_holes not in (9, 18) or len(self.holes) > self.planned_holes:
            raise ValueError('Invalid round length.')
        if [hole.number for hole in self.holes] != list(range(1, len(self.holes) + 1)):
            raise ValueError('Played holes must be a contiguous ordered prefix.')
        return self


class RoundResponse(BaseModel):
    id: UUID
    submission_id: UUID
    course_name: str
    planned_holes: int
    played_holes: int
    status: Literal['complete', 'early_finished']
    completed_at: datetime
    created_at: datetime
    holes: list[HoleInput]
    strokes: int
    par: int
    putts: int
    relative_to_par: int


class RoundPage(BaseModel):
    items: list[RoundResponse]
    next_cursor: str | None
