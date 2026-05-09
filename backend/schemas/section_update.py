from pydantic import BaseModel


class SectionUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

