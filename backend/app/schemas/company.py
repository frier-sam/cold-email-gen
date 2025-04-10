from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from pydantic import validator


class ServiceItem(BaseModel):
    name: str
    description: Optional[str] = None


class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    services: Optional[List[ServiceItem]] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    services: Optional[List[ServiceItem]] = None


class CompanyInDB(CompanyBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

    @validator('services', pre=True)
    def parse_services(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v


class Company(CompanyInDB):
    pass