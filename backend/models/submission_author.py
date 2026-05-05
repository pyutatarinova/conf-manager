import uuid

from sqlalchemy import Column, Text, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from database import Base

class SubmissionAuthor(Base):
    __tablename__ = "submission_authors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    submission_id = Column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    affiliation = Column(Text, nullable=True)

    author_order = Column(Integer, nullable=False)

    is_corresponding = Column(Boolean, default=False, nullable=False)