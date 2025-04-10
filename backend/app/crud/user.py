from typing import Any, Dict, Optional, Union, List
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.security import get_password_hash, verify_password


def get(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_multi(
    db: Session, *, skip: int = 0, limit: int = 100
) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def create(db: Session, *, obj_in: UserCreate) -> User:
    db_obj = User(
        email=obj_in.email,
        username=obj_in.username,
        hashed_password=get_password_hash(obj_in.password),
        is_active=True,
        is_admin=False,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update(
    db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
) -> User:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.dict(exclude_unset=True)
        
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data["password"])
        del update_data["password"]
        
    for field in update_data:
        if field in update_data:
            setattr(db_obj, field, update_data[field])
            
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, *, user_id: int) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()


def authenticate(db: Session, *, email: str, password: str) -> Optional[User]:
    user = get_by_email(db, email=email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
