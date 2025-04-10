import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.email import Email
from app.schemas.email import EmailCreate


def get(db: Session, email_id: int) -> Optional[Email]:
    return db.query(Email).filter(Email.id == email_id).first()


def get_multi_by_user(
    db: Session, *, user_id: int, skip: int = 0, limit: int = 100
) -> List[Email]:
    return (
        db.query(Email)
        .filter(Email.user_id == user_id)
        .order_by(Email.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_user_emails_today(db: Session, *, user_id: int) -> int:
    today = datetime.now().date()
    tomorrow = today + timedelta(days=1)
    
    return (
        db.query(Email)
        .filter(Email.user_id == user_id)
        .filter(Email.created_at >= today)
        .filter(Email.created_at < tomorrow)
        .count()
    )


def create(
    db: Session, 
    *, 
    obj_in: EmailCreate, 
    user_id: int,
    subject: str,
    content: str,
    target_company_name: str
) -> Email:
    additional_websites_json = None
    if obj_in.additional_websites:
        additional_websites_json = json.dumps(obj_in.additional_websites)
        
    db_obj = Email(
        subject=subject,
        content=content,
        target_company_name=target_company_name,
        target_company_website=obj_in.target_company_website,
        additional_websites=additional_websites_json,
        custom_instructions=obj_in.custom_instructions,
        user_id=user_id,
        company_id=obj_in.company_id,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, email_id: int) -> None:
    email = db.query(Email).filter(Email.id == email_id).first()
    if email:
        db.delete(email)
        db.commit()