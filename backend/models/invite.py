import uuid
from datetime import datetime

from sqlalchemy import Column, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class Invite(Base):
    __tablename__ = "invites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    conference_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conferences.id", ondelete="CASCADE"),
        nullable=False
    )

    section_id = Column(
    UUID(as_uuid=True),
    ForeignKey("sections.id", ondelete="SET NULL"),
    nullable=True
    )

    email = Column(Text, nullable=False)
    role = Column(Text, nullable=False)

    token = Column(Text, unique=True, nullable=False)

    is_used = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)