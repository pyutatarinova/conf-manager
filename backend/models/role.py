from sqlalchemy import Column, Integer, Text
from database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(Text, unique=True)