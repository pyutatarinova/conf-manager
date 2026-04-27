import uuid
from datetime import datetime

from sqlalchemy import Column, Text, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    storage_path = Column(Text, nullable=False)
    original_name = Column(Text, nullable=False)
    mime_type = Column(Text, nullable=False)
    size = Column(Integer, nullable=False)

    uploaded_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    created_at = Column(DateTime, default=datetime.utcnow)