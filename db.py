# db.py
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import declarative_base, relationship
import datetime
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    api_key = Column(String, unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    api_keys = relationship("APIKey", back_populates="user")
    workflows = relationship("Workflow", back_populates="owner")

# Create tables
# Create tables

# --- New Models for Real Data ---
class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="active")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_used = Column(DateTime, default=datetime.datetime.utcnow)
    api_calls = Column(Integer, default=0)
    endpoint = Column(String, nullable=True)
    owner = relationship("User", back_populates="workflows")

class APICallLog(Base):
    __tablename__ = "api_call_logs"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    latency_ms = Column(Float, nullable=True)
    status_code = Column(Integer, nullable=True)
    endpoint = Column(String, nullable=True)

class WorkflowAnalytics(Base):
    __tablename__ = "workflow_analytics"
    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    calls = Column(Integer, default=0)
    avg_latency = Column(Float, default=0.0)

Base.metadata.create_all(bind=engine)
