from datetime import datetime
from pydantic import BaseModel


class ConferenceCreate(BaseModel):
    title: str
    description: str | None = None
    submission_deadline: datetime | None = None
    is_public: bool = False


class ConferenceResponse(BaseModel):
    id: str
    title: str
    description: str | None
    submission_deadline: datetime | None
    is_public: bool