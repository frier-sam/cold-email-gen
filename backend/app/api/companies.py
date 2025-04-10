from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.company import Company
from app.schemas.company import (
    Company as CompanySchema,
    CompanyCreate,
    CompanyUpdate,
)
from app.db.session import get_db
from app.utils.security import get_current_user
import app.crud.company as crud_company

router = APIRouter()

@router.get("/", response_model=List[CompanySchema])
def read_companies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve companies.
    """
    companies = crud_company.get_multi_by_owner(
        db=db, owner_id=current_user.id, skip=skip, limit=limit
    )
    return companies

@router.post("/", response_model=CompanySchema)
def create_company(
    *,
    db: Session = Depends(get_db),
    company_in: CompanyCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new company.
    """
    # Check if user has reached their limit
    companies = crud_company.get_multi_by_owner(db=db, owner_id=current_user.id)
    if len(companies) >= current_user.max_companies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You have reached your limit of {current_user.max_companies} companies",
        )
        
    company = crud_company.create(db=db, obj_in=company_in, owner_id=current_user.id)
    return company

@router.get("/{company_id}", response_model=CompanySchema)
def read_company(
    *,
    db: Session = Depends(get_db),
    company_id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get company by ID.
    """
    company = crud_company.get(db=db, company_id=company_id)
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
    return company

@router.put("/{company_id}", response_model=CompanySchema)
def update_company(
    *,
    db: Session = Depends(get_db),
    company_id: int,
    company_in: CompanyUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a company.
    """
    company = crud_company.get(db=db, company_id=company_id)
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
    company = crud_company.update(db=db, db_obj=company, obj_in=company_in)
    return company

@router.delete("/{company_id}", response_model=CompanySchema)
def delete_company(
    *,
    db: Session = Depends(get_db),
    company_id: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Delete a company.
    """
    company = crud_company.get(db=db, company_id=company_id)
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
    # Save the company data for the return value
    return_company = company
    crud_company.delete(db=db, company_id=company_id)
    return return_company
