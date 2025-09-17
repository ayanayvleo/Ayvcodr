
import sys
import os
import pytest
from fastapi.testclient import TestClient
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from db import Base, APICallLog, Workflow
import datetime

# Use a separate test database file
TEST_DB_URL = "sqlite:///./test_dashboard.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Populate with sample data
    db = TestingSessionLocal()
    # Add sample API call logs
    for i in range(10):
        db.add(APICallLog(timestamp=datetime.datetime(2025, 9, 17, 12, 0, i), latency_ms=100 + i))
    # Add sample workflows
    db.add(Workflow(name="Test Workflow", description="Sample workflow", status="active", owner_id="test_owner", api_calls=5, last_used=datetime.datetime(2025, 9, 17, 12, 0, 0), created_at=datetime.datetime(2025, 9, 1, 9, 0, 0), endpoint="/api/test"))
    db.commit()
    db.close()
    yield
    # Drop tables after tests
    Base.metadata.drop_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

from db import SessionLocal
app.dependency_overrides[SessionLocal] = override_get_db

client = TestClient(app)

def test_dashboard_stats():
    response = client.get("/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_api_calls" in data
    assert "active_workflows" in data
    assert "cost_savings" in data
    assert "avg_response_time" in data


def test_dashboard_api_usage_trend():
    response = client.get("/dashboard/api-usage-trend?days=7")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "date" in data[0]
        assert "calls" in data[0]
        assert "avg_latency" in data[0]


def test_dashboard_workflows():
    response = client.get("/dashboard/workflows")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "id" in data[0]
        assert "name" in data[0]
        assert "description" in data[0]
        assert "status" in data[0]
        assert "apiCalls" in data[0]
        assert "lastUsed" in data[0]
        assert "createdAt" in data[0]
        assert "endpoint" in data[0]
