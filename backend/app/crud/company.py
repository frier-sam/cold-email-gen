import json
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session

from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate


def get(db: Session, company_id: int) -> Optional[Company]:
    company = db.query(Company).filter(Company.id == company_id).first()
    if company and company.services:
        # Parse the JSON string back into a list
        try:
            company.services = json.loads(company.services)
        except:
            company.services = []
    return company


def get_multi_by_owner(
    db: Session, *, owner_id: int, skip: int = 0, limit: int = 100
) -> List[Company]:
    companies = (
        db.query(Company)
        .filter(Company.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Parse the JSON string to list for each company
    for company in companies:
        if company.services:
            try:
                company.services = json.loads(company.services)
            except:
                company.services = []
    
    return companies


def create(db: Session, *, obj_in: CompanyCreate, owner_id: int) -> Company:
    # Convert services to JSON string if provided
    services_json = None
    if obj_in.services:
        if isinstance(obj_in.services, list):
            services_json = json.dumps(obj_in.services)
        else:
            services_json = obj_in.services
        
    db_obj = Company(
        name=obj_in.name,
        description=obj_in.description,
        services=services_json,
        owner_id=owner_id,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update(
    db: Session,
    *,
    db_obj: Company,
    obj_in: Union[CompanyUpdate, Dict[str, Any]]
) -> Company:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
        
    # Convert services list to JSON string if it exists
    if "services" in update_data and update_data["services"] is not None:
        if isinstance(update_data["services"], list):
            update_data["services"] = json.dumps(update_data["services"])
        
    for field in update_data:
        if field in update_data:
            setattr(db_obj, field, update_data[field])
            
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, company_id: int) -> None:
    company = db.query(Company).filter(Company.id == company_id).first()
    if company:
        db.delete(company)
        db.commit()