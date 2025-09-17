from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from db import Base
import datetime

class APIKey(Base):
    __tablename__ = "api_keys"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    key = Column(String, unique=True, index=True, nullable=False)
    permissions = Column(String, nullable=False)  # comma-separated global permissions
    workflow_permissions = Column(JSON, nullable=True)  # {workflow_id: [permissions]}
    rate_limit = Column(Integer, default=1000)
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    user = relationship("User", back_populates="api_keys")

# Add to User model in db.py:
# api_keys = relationship("APIKey", back_populates="user")
