from uuid import UUID
from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    conference_id: UUID
    section_id: UUID | None = None
    title: str
    article_file_id: UUID
    abstract_file_id: UUID

    affiliation: str | None = None
