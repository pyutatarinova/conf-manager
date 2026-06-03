from pydantic import BaseModel

class ProgramToggleRequest(BaseModel):
    is_in_program: bool