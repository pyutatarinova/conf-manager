from uuid import UUID
from pydantic import BaseModel

class ReviewCreate(BaseModel):
    submission_id: UUID
    decision: str
    comments: str
    file_id: UUID | None = None