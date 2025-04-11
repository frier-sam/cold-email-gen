from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.company import Company
from app.models.email import Email
from app.schemas.user import User as UserSchema, UserUpdate
from app.db.session import get_db
from app.utils.security import get_current_user, get_current_active_admin
import app.crud.user as crud_user
import app.crud.email as crud_email

router = APIRouter()

@router.get("/stats", response_model=dict)
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Any:
    """Get user usage statistics."""
    company_count = db.query(Company).filter(Company.owner_id == current_user.id).count()
    email_count_today = crud_email.get_user_emails_today(db=db, user_id=current_user.id)
    
    return {
        "companies": {
            "used": company_count,
            "total": current_user.max_companies,
            "remaining": current_user.max_companies - company_count
        },
        "emails": {
            "used_today": email_count_today,
            "total_per_day": current_user.max_emails_per_day,
            "remaining_today": current_user.max_emails_per_day - email_count_today
        }
    }

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserSchema)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update own user.
    """
    return crud_user.update(db, db_obj=current_user, obj_in=user_in)

@router.get("/{user_id}", response_model=UserSchema)
def read_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_active_admin),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific user by id.
    """
    user = crud_user.get(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user

@router.get("/", response_model=List[UserSchema])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_admin),
) -> Any:
    """
    Retrieve users.
    """
    users = crud_user.get_multi(db, skip=skip, limit=limit)
    return users

@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_admin),
) -> Any:
    """
    Update a user.
    """
    user = crud_user.get(db, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    user = crud_user.update(db, db_obj=user, obj_in=user_in)
    return user

