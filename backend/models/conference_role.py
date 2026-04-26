# models/conference_role.py

from sqlalchemy import Column, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base


class ConferenceRole(Base):
    __tablename__ = "conference_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    conference_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conferences.id", ondelete="CASCADE"),
        nullable=False
    )

    role = Column(Text, nullable=False)

    # ❗️ВАЖНО: один пользователь = одна роль в одной конференции
    __table_args__ = (
        UniqueConstraint("user_id", "conference_id", name="unique_user_conference"),
    )