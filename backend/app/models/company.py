from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import json

from app.db.base import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    _services = Column("services", Text, nullable=True)  # Renamed to _services
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="companies")
    emails = relationship("Email", back_populates="company", cascade="all, delete-orphan")
    
    @property
    def services(self):
        """Get services as Python object"""
        if self._services:
            try:
                return json.loads(self._services)
            except:
                return []
        return []
    
    @services.setter
    def services(self, value):
        """Set services, converting to JSON string if needed"""
        if value is None:
            self._services = None
        elif isinstance(value, str):
            self._services = value
        else:
            self._services = json.dumps(value)