from datetime import datetime
from pydantic import BaseModel


class ConferenceCreate(BaseModel):
    title: str
    description: str | None = None
    start_date: datetime | None = None
    submission_deadline: datetime | None = None
    is_public: bool = False
    is_submit: bool = True


class ConferenceResponse(BaseModel):
    id: str
    title: str
    description: str | None
    start_date: datetime | None
    submission_deadline: datetime | None
    is_public: bool
    is_submit: bool


class ConferenceUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_date: datetime | None = None
    submission_deadline: datetime | None = None
    is_public: bool | None = None
    is_submit: bool | None = None
