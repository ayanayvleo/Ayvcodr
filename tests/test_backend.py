
import sys
import os
import pytest
from fastapi.testclient import TestClient
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/docs")
    assert response.status_code == 200

def test_register_and_login():
    import uuid
    unique = uuid.uuid4().hex[:8]
    username = f"testuser_{unique}"
    email = f"test_{unique}@example.com"
    # Register
    payload = {"username": username, "email": email, "password": "testpass123"}
    response = client.post("/register", json=payload)
    assert response.status_code == 200
    assert "username" in response.json()
    # Login
    payload = {"username": username, "password": "testpass123"}
    response = client.post("/login", json=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_api_key_management():
    # This is a placeholder; implement full CRUD tests for API keys
    pass

def test_privacy_endpoints():
    # This is a placeholder; implement tests for data export, deletion, consent, audit logs
    pass
