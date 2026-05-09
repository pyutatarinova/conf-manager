from uuid import UUID
from pydantic import BaseModel

class ReviewAssignmentCreate(BaseModel):
    submission_id: UUID
    reviewer_id: UUID