from sqlalchemy import Column, String, Text, TIMESTAMP, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    affiliation = Column(Text)
    bio = Column(Text)
    is_superadmin = Column(Boolean, default=False, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)