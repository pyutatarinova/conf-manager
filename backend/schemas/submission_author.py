from pydantic import BaseModel, EmailStr

class SubmissionAuthorCreate(BaseModel):
    name: str
    email: EmailStr
    affiliation: str | None = None
    author_order: int
    is_corresponding: bool = False