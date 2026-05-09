from pydantic import BaseModel

class SubmissionDecisionCreate(BaseModel):
    decision: str
    comment: str | None = None