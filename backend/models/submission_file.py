import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, ForeignKey, UniqueConstraint, Text
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class SubmissionFile(Base):
    __tablename__ = "submission_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    submission_id = Column(
        UUID(as_uuid=True),
        ForeignKey("submissions.id", ondelete="CASCADE"),
        nullable=False
    )

    file_id = Column(
        UUID(as_uuid=True),
        ForeignKey("files.id", ondelete="CASCADE"),
        nullable=False
    )

    version = Column(Integer, nullable=False)

    file_type = Column(Text, nullable=False, default="paper")

    uploaded_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint(
            "submission_id",
            "version",
            "file_type",
            name="unique_submission_version_type"
        ),
    )
