from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String)
    content = Column(Text)
    target_company_name = Column(String)
    target_company_website = Column(String)
    additional_websites = Column(JSON, nullable=True)  # Array of additional URLs
    custom_instructions = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="emails")
    company = relationship("Company", back_populates="emails")