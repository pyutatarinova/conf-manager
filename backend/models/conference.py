import uuid
from sqlalchemy import Column, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from database import Base


class Conference(Base):
    __tablename__ = "conferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)

    submission_deadline = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    is_public = Column(Boolean, default=False)