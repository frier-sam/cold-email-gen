from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base
from app.config import settings


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # User limits
    max_companies = Column(Integer, default=settings.DEFAULT_MAX_COMPANIES)
    max_websites_per_email = Column(Integer, default=settings.DEFAULT_MAX_WEBSITES_PER_EMAIL)
    max_emails_per_day = Column(Integer, default=settings.DEFAULT_MAX_EMAILS_PER_DAY)
    
    # Relationships
    companies = relationship("Company", back_populates="owner", cascade="all, delete-orphan")
    emails = relationship("Email", back_populates="user", cascade="all, delete-orphan")
