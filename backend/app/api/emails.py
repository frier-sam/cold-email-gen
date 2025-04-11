from typing import Any, List
import json

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.company import Company
from app.schemas.email import (
    EmailCreate,
    EmailResponse,
    EmailPreview,
)
from app.db.session import get_db
from app.utils.security import get_current_user
from app.utils.email_generator import generate_cold_email
from app.utils.web_scraper import extract_company_info
import app.crud.company as crud_company
import app.crud.email as crud_email
import logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[EmailPreview])
def read_emails(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve emails.
    """
    emails = crud_email.get_multi_by_user(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    return emails

@router.post("/", response_model=EmailResponse)
async def create_email(
    *,
    db: Session = Depends(get_db),
    email_in: EmailCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new email.
    """
    # Check daily limit
    emails_today = crud_email.get_user_emails_today(db=db, user_id=current_user.id)
    if emails_today >= current_user.max_emails_per_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached your daily limit of {current_user.max_emails_per_day} emails",
        )
        
    # Check websites limit
    additional_websites = email_in.additional_websites or []
    if len(additional_websites) > current_user.max_websites_per_email - 1:  # -1 for the main website
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You can only scan up to {current_user.max_websites_per_email} websites per email",
        )
        
    # Check if company exists and belongs to user
    company = crud_company.get(db=db, company_id=email_in.company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )
    if company.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
        
    # Extract target company info from the website
    target_company_info = await extract_company_info(
        email_in.target_company_website, 
        additional_urls=email_in.additional_websites
    )
    
    services = []
    if company.services:
        if isinstance(company.services, str):
            try:
                services = json.loads(company.services)
            except json.JSONDecodeError:
                services = []
        else:
            # If it's already a list or dict, use it directly
            services = company.services
        
    # Generate the cold email
    subject, content = await generate_cold_email(
        company_name=company.name,
        company_description=company.description,
        services=services,
        target_company_info=target_company_info,
        custom_instructions=email_in.custom_instructions
    )
    
    # Create email in database
    email = crud_email.create(
        db=db,
        obj_in=email_in,
        user_id=current_user.id,
        subject=subject,
        content=content,
        target_company_name=target_company_info.get("name", "Target Company")
    )
    
    return email

@router.get("/{email_id}", response_model=EmailResponse)
def read_email(
    *,
    db: Session = Depends(get_db),
    email_id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get email by ID.
    """
    email = crud_email.get(db=db, email_id=email_id)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    if email.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return email

@router.delete("/{email_id}", response_model=EmailResponse)
def delete_email(
    *,
    db: Session = Depends(get_db),
    email_id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete an email.
    """
    email = crud_email.get(db=db, email_id=email_id)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    if email.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    # Save the email data for the return value
    return_email = email
    crud_email.delete(db=db, email_id=email_id)
    return return_email

@router.get("/company/{company_id}", response_model=List[EmailPreview])
def get_emails_by_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get emails by company ID.
    """
    # First, check if the company exists and belongs to the user
    company = crud_company.get(db=db, company_id=company_id)
    if not company or company.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found or you don't have access to it"
        )
    
    # Get emails for this company
    emails = crud_email.get_by_company(db=db, company_id=company_id)
    
    # Log how many emails were found
    logger.info(f"Found {len(emails)} emails for company_id {company_id}")
    
    return emails