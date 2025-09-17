from fastapi import FastAPI, Header, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Callable
from user_apis import create_user_router, user_routers
from auth import auth_router, get_current_user, User
from textblob import TextBlob
from rake_nltk import Rake
from api_keys_router import router as api_keys_router
from privacy_router import router as privacy_router

# In-memory user API config and API keys (for demo; use a DB in production)
USER_API_KEYS = {"demo_user": "demo_secret"}
USER_API_DEFS = {}

import os
from db import SessionLocal, User, Workflow, APICallLog, WorkflowAnalytics
from sqlalchemy.orm import Session
import smtplib
from email.mime.text import MIMEText
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AyvCodr",
    description="AyvCodr API Platform. Docs: https://ayvcodr.com",
    version="1.0.0",
    contact={
        "name": "AyvCodr",
        "url": "https://ayvcodr.com",
        "email": "hello@ayvcodr.com"
    }
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ayvcodr.com", "https://www.ayvcodr.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(api_keys_router)
app.include_router(privacy_router)
# --- Workflow and API Endpoint Creation ---
class WorkflowCreateRequest(BaseModel):
    name: str
    description: str = ""
    endpoint: str = ""
    owner_id: str = "test_owner"

@app.post("/workflows")
def create_workflow(req: WorkflowCreateRequest, db: Session = Depends(SessionLocal)):
    workflow = Workflow(
        name=req.name,
        description=req.description,
        endpoint=req.endpoint,
        status="active",
        owner_id=req.owner_id
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return {
        "id": workflow.id,
        "name": workflow.name,
        "description": workflow.description,
        "status": workflow.status,
        "endpoint": workflow.endpoint,
        "createdAt": workflow.created_at,
    }

class APIEndpointCreateRequest(BaseModel):
    name: str
    endpoint: str
    owner_id: str = "test_owner"

@app.post("/api-endpoints")
def create_api_endpoint(req: APIEndpointCreateRequest, db: Session = Depends(SessionLocal)):
    workflow = Workflow(
        name=req.name,
        endpoint=req.endpoint,
        status="active",
        owner_id=req.owner_id
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return {
        "id": workflow.id,
        "name": workflow.name,
        "endpoint": workflow.endpoint,
        "status": workflow.status,
        "createdAt": workflow.created_at,
    }

# --- Test Email Endpoint ---
class EmailTestRequest(BaseModel):
    to: str
    subject: str = "Test Email from AyvCodr"
    body: str = "This is a test email sent from the AyvCodr backend."

@app.post("/test-email")
def send_test_email(req: EmailTestRequest):
    smtp_server = os.getenv("SMTP_SERVER") or ""
    smtp_port = os.getenv("SMTP_PORT") or ""
    smtp_user = os.getenv("SMTP_USER") or ""
    smtp_password = os.getenv("SMTP_PASSWORD") or ""
    email_from = os.getenv("EMAIL_FROM") or ""
    missing = []
    if not smtp_server:
        missing.append("SMTP_SERVER")
    if not smtp_port:
        missing.append("SMTP_PORT")
    if not smtp_user:
        missing.append("SMTP_USER")
    if not smtp_password:
        missing.append("SMTP_PASSWORD")
    if not email_from:
        missing.append("EMAIL_FROM")
    if missing:
        return JSONResponse(status_code=500, content={"detail": f"Missing environment variables: {', '.join(missing)}"})
    try:
        smtp_port_int = int(smtp_port)
    except Exception:
        return JSONResponse(status_code=500, content={"detail": "SMTP_PORT must be an integer."})
    msg = MIMEText(req.body)
    msg["Subject"] = req.subject or ""
    msg["From"] = email_from or ""
    msg["To"] = req.to or ""
    try:
        with smtplib.SMTP(smtp_server, smtp_port_int) as server:
            server.starttls()
            server.login(smtp_user or "", smtp_password or "")
            server.sendmail(email_from or "", [req.to or ""], msg.as_string())
        return {"detail": f"Test email sent to {req.to}"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

# --- Built-in Example Endpoint ---
class TextAnalysisRequest(BaseModel):
    text: str

class TextAnalysisResponse(BaseModel):
    length: int
    word_count: int

@app.post("/analyze", response_model=TextAnalysisResponse)
def analyze_text(request: TextAnalysisRequest):
    text = request.text
    length = len(text)
    word_count = len(text.split())
    return TextAnalysisResponse(length=length, word_count=word_count)

# --- Dynamic User Endpoint Registration ---
class UserEndpointRequest(BaseModel):
    user_id: str
    operation: str  # e.g., 'text_length', 'word_count', etc.
    params: Dict = {}

# Pre-defined safe logic templates
def text_length_logic(data):
    text = data.get('text', '')
    return {"length": len(text)}

def word_count_logic(data):
    text = data.get('text', '')
    return {"word_count": len(text.split())}

def sentiment_analysis_logic(data):
    text = data.get('text', '')
    blob = TextBlob(text)
    sentiment = blob.sentiment
    return {"polarity": sentiment.polarity, "subjectivity": sentiment.subjectivity}  # type: ignore

def keyword_extraction_logic(data):
    text = data.get('text', '')
    rake = Rake()
    rake.extract_keywords_from_text(text)
    keywords = rake.get_ranked_phrases()
    return {"keywords": keywords}

ALLOWED_OPERATIONS = {
    'text_length': text_length_logic,
    'word_count': word_count_logic,
    'sentiment': sentiment_analysis_logic,
    'keywords': keyword_extraction_logic,
}

@app.post("/register-endpoint")
def register_user_endpoint(req: UserEndpointRequest, x_api_key: str = Header(...)):
    # Auth check
    if USER_API_KEYS.get(req.user_id) != x_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key.")
    if req.operation not in ALLOWED_OPERATIONS:
        return {"error": f"Operation '{req.operation}' not allowed."}
    endpoint_logic = ALLOWED_OPERATIONS[req.operation]
    router = create_user_router(req.user_id, endpoint_logic)
    # Remove old router from app.routes if it exists
    from fastapi.routing import APIRoute
    app.router.routes = [r for r in app.router.routes if not (isinstance(r, APIRoute) and getattr(r, 'path', None) == f"/api/{req.user_id}/custom")]
    app.include_router(router)
    # Store user API definition
    USER_API_DEFS[req.user_id] = {"operation": req.operation, "params": req.params}
    return {"message": f"Custom endpoint for user {req.user_id} registered at /api/{req.user_id}/custom with operation '{req.operation}'"}

# --- AI/Business Endpoints ---
class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    polarity: float
    subjectivity: float

@app.post("/ai/sentiment", response_model=SentimentResponse)
def analyze_sentiment(request: SentimentRequest, current_user: User = Depends(get_current_user)):
    blob = TextBlob(request.text)
    sentiment = blob.sentiment
    return SentimentResponse(polarity=sentiment.polarity, subjectivity=sentiment.subjectivity)  # type: ignore

class KeywordsRequest(BaseModel):
    text: str
    num_keywords: int = 5

class KeywordsResponse(BaseModel):
    keywords: list

@app.post("/ai/keywords", response_model=KeywordsResponse)
def extract_keywords(request: KeywordsRequest, current_user: User = Depends(get_current_user)):
    rake = Rake()
    rake.extract_keywords_from_text(request.text)
    return KeywordsResponse(keywords=rake.get_ranked_phrases()[:request.num_keywords])

# --- Middleware for API key auth and rate limiting ---
def check_rate_limit(user_id: str):
    # Placeholder for rate limiting logic
    pass

# --- Environment Variable Check Endpoint ---

# --- Real Dashboard Endpoints ---
from fastapi import Query
from sqlalchemy.orm import Session

@app.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(SessionLocal)):
    total_api_calls = db.query(APICallLog).count()
    active_workflows = db.query(Workflow).filter(Workflow.status == "active").count()
    avg_response_time = db.query(APICallLog).filter(APICallLog.latency_ms != None).with_entities(APICallLog.latency_ms).all()
    avg_response_time = round(sum([x[0] for x in avg_response_time]) / len(avg_response_time), 2) if avg_response_time else 0
    # Cost savings is a placeholder, replace with real logic if available
    cost_savings = 2847
    return {
        "total_api_calls": total_api_calls,
        "active_workflows": active_workflows,
        "cost_savings": cost_savings,
        "avg_response_time": avg_response_time,
    }

@app.get("/dashboard/api-usage-trend")
def api_usage_trend(days: int = Query(7), db: Session = Depends(SessionLocal)):
    from sqlalchemy import func
    trend = (
        db.query(
            func.date(APICallLog.timestamp).label("date"),
            func.count().label("calls"),
            func.avg(APICallLog.latency_ms).label("avg_latency")
        )
        .group_by(func.date(APICallLog.timestamp))
        .order_by(func.date(APICallLog.timestamp).desc())
        .limit(days)
        .all()
    )
    return [
        {"date": str(row.date), "calls": row.calls, "avg_latency": round(row.avg_latency or 0, 2)}
        for row in trend
    ]

@app.get("/dashboard/workflows")
def dashboard_workflows(db: Session = Depends(SessionLocal)):
    workflows = db.query(Workflow).all()
    return [
        {
            "id": w.id,
            "name": w.name,
            "description": w.description,
            "status": w.status,
            "apiCalls": w.api_calls,
            "lastUsed": w.last_used,
            "createdAt": w.created_at,
            "endpoint": w.endpoint,
        }
        for w in workflows
    ]

@app.middleware("http")
async def auth_and_rate_limit(request: Request, call_next):
    # Only protect /api/{user_id}/custom endpoints
    if request.url.path.startswith("/api/"):
        parts = request.url.path.split("/")
        if len(parts) > 3:
            user_id = parts[2]
            api_key = request.headers.get("x-api-key")
            if USER_API_KEYS.get(user_id) != api_key:
                return JSONResponse(status_code=401, content={"detail": "Invalid API key."})
            check_rate_limit(user_id)
    response = await call_next(request)
    return response
