from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db import SessionLocal, User
from models_apikey import APIKey
from pydantic import BaseModel
from typing import List, Optional, Dict
import secrets
from datetime import datetime

router = APIRouter(prefix="/api-keys", tags=["api-keys"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class APIKeyCreate(BaseModel):
    name: str
    permissions: List[str]
    workflow_permissions: Optional[Dict[str, List[str]]] = None
    rate_limit: int = 1000
    expires_at: Optional[datetime] = None

class APIKeyOut(BaseModel):
    id: int
    name: str
    key: str
    permissions: List[str]
    workflow_permissions: Optional[Dict[str, List[str]]]
    rate_limit: int
    usage_count: int
    last_used: Optional[datetime]
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool

    model_config = {"from_attributes": True}

@router.get("/", response_model=List[APIKeyOut])
def list_api_keys(user_id: int, db: Session = Depends(get_db)):
    return db.query(APIKey).filter(APIKey.user_id == user_id).all()

@router.post("/", response_model=APIKeyOut)
def create_api_key(user_id: int, data: APIKeyCreate, db: Session = Depends(get_db)):
    key = "sk-" + secrets.token_hex(16)
    api_key = APIKey(
        user_id=user_id,
        name=data.name,
        key=key,
        permissions=','.join(data.permissions),
        workflow_permissions=data.workflow_permissions,
        rate_limit=data.rate_limit,
        created_at=datetime.utcnow(),
        is_active=True,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key

@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(user_id: int, key_id: int, db: Session = Depends(get_db)):
    api_key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == user_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    db.delete(api_key)
    db.commit()
    return

@router.patch("/{key_id}", response_model=APIKeyOut)
def update_api_key(user_id: int, key_id: int, data: APIKeyCreate, db: Session = Depends(get_db)):
    api_key = db.query(APIKey).filter(APIKey.id == key_id, APIKey.user_id == user_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    setattr(api_key, 'name', data.name)
    setattr(api_key, 'permissions', ','.join(data.permissions))
    setattr(api_key, 'workflow_permissions', data.workflow_permissions)
    setattr(api_key, 'rate_limit', data.rate_limit)
    setattr(api_key, 'expires_at', data.expires_at)
    db.commit()
    db.refresh(api_key)
    return api_key
