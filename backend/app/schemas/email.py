from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from datetime import datetime


class EmailBase(BaseModel):
    target_company_website: str = Field(..., description="Main website URL of the target company")
    additional_websites: Optional[List[str]] = Field(None, description="Additional URLs to scan")
    custom_instructions: Optional[str] = Field(None, description="Custom instructions for email generation (tone, style, etc.)")


class EmailCreate(EmailBase):
    company_id: int = Field(..., description="ID of the user's company that's offering services")


class EmailResponse(BaseModel):
    id: int
    subject: str
    content: str
    target_company_name: str
    target_company_website: str
    additional_websites: Optional[List[str]] = None
    custom_instructions: Optional[str] = None
    company_id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class EmailPreview(BaseModel):
    id: int
    target_company_name: str
    subject: str
    created_at: datetime

    class Config:
        orm_mode = True
