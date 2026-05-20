from uuid import UUID
from pydantic import BaseModel

class SubmissionRevisionCreate(BaseModel):
    article_file_id: UUID
    abstract_file_id: UUID