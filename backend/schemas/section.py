from pydantic import BaseModel


class SectionCreate(BaseModel):
    name: str
    description: str | None = None