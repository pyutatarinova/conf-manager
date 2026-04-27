from uuid import UUID
from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    conference_id: UUID
    section_id: UUID | None = None
    title: str
    file_id: UUID