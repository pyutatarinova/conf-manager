from uuid import UUID
from pydantic import BaseModel


class SubmissionUpdate(BaseModel):
    section_id: UUID | None = None

