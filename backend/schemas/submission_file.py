from uuid import UUID

from pydantic import BaseModel


class AttachThesisRequest(BaseModel):
    file_id: UUID

