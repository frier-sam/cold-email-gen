# app/api/tasks.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.session import get_db
from app.models.user import User
from app.utils.security import get_current_user
from app.utils.task_queue import add_task, get_task_status
from app.utils.llm_agent import generate_email_with_agent
import app.crud.company as crud_company
import app.crud.email as crud_email
import json
import logging


router = APIRouter()





logger = logging.getLogger(__name__)



@router.post("/generate-emails", response_model=Dict[str, Any])
async def create_email_generation_tasks(
    *,
    db: Session = Depends(get_db),
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create email generation tasks for multiple target URLs.
    """
    logger.info(f"Received request to generate emails: {data}")
    company_id = data.get("company_id")
    target_urls = data.get("target_urls", "").split(",")
    target_urls = [url.strip() for url in target_urls if url.strip()]
    
    if not target_urls:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No target URLs provided"
        )
    
    # Check daily limit
    emails_today = crud_email.get_user_emails_today(db=db, user_id=current_user.id)
    if emails_today + len(target_urls) > current_user.max_emails_per_day:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This would exceed your daily limit of {current_user.max_emails_per_day} emails"
        )
    
    # Check if company exists and belongs to user
    company = crud_company.get(db=db, company_id=company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    if company.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Format the company data for the agent
    company_data = {
        "name": company.name,
        "description": company.description,
        "services": json.loads(company.services) if isinstance(company.services, str) else company.services
    }
    
    logger.info(f"Creating tasks for URLs: {target_urls}")
    
    # Create tasks for each URL
    task_ids = []
    for url in target_urls:
        try:
            # Create synchronous task that will call the async function
            def task_wrapper():
                import asyncio
                logger.info(f"Starting task for URL: {url}")
                result = asyncio.run(generate_email_with_agent(
                    task_id=task_id,  # Will be defined below
                    company_data=company_data,
                    target_url=url,
                    find_contact=data.get("find_contact", False),
                    tone=data.get("tone", "professional"),
                    personalization_level=data.get("personalization_level", "medium"),
                    custom_instructions=data.get("custom_instructions")
                ))
                logger.info(f"Task completed for URL: {url}")
                return result
            
            # Add the task to the queue
            task_id = add_task(task_wrapper)
            task_ids.append({"url": url, "task_id": task_id})
            logger.info(f"Task created with ID: {task_id} for URL: {url}")
        except Exception as e:
            logger.error(f"Error creating task for URL {url}: {str(e)}")
    
    return {"tasks": task_ids}

@router.get("/status/{task_id}", response_model=Dict[str, Any])
async def get_task_status_endpoint(
    task_id: str,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get the status of a task.
    """
    status = get_task_status(task_id)
    return status
# app/api/tasks.py
@router.post("/save-email", response_model=Dict[str, Any])
async def save_generated_email(
    *,
    db: Session = Depends(get_db),
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Save a generated email to the database.
    """
    logger.info(f"Saving email for company_id: {data.get('company_id')}")
    
    company_id = data.get("company_id")
    
    # Check if company exists and belongs to user
    company = crud_company.get(db=db, company_id=company_id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    if company.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Save the email
    email = crud_email.save_generated_email(
        db=db,
        user_id=current_user.id,
        company_id=company_id,
        target_company_name=data.get("target_company_name", "Unknown Company"),
        target_company_website=data.get("target_url", ""),
        subject=data.get("subject", ""),
        content=data.get("body", ""),
        contact_info=data.get("contact_info"),
        custom_instructions=data.get("custom_instructions")
    )
    
    logger.info(f"Email saved successfully with ID: {email.id}")
    
    return {
        "id": email.id,
        "message": "Email saved successfully"
    }