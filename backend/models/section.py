import uuid

from sqlalchemy import Column, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Section(Base):
    __tablename__ = "sections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    conference_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conferences.id", ondelete="CASCADE"),
        nullable=False
    )

    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)