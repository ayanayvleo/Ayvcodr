from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from auth import get_current_user, User
import io
import csv
import datetime

router = APIRouter(prefix="/privacy", tags=["privacy"])

# --- Models ---
class ConsentUpdateRequest(BaseModel):
    data_processing_consent: Optional[bool] = None
    marketing_consent: Optional[bool] = None
    analytics_consent: Optional[bool] = None
    cookie_consent: Optional[bool] = None

class AuditLogEntry(BaseModel):
    id: str
    action: str
    timestamp: datetime.datetime
    status: str
    details: str

# --- In-memory storage for demo ---
USER_CONSENTS = {}
USER_AUDIT_LOGS = {}
USER_DATA = {  # Demo user data
    1: {"name": "Demo User", "email": "demo@example.com", "data": "Sample user data..."}
}

# --- Endpoints ---
@router.post("/export")
def export_user_data(current_user: User = Depends(get_current_user)):
    user_id = getattr(current_user, 'id')
    user_data = USER_DATA.get(user_id)
    if not user_data:
        raise HTTPException(status_code=404, detail="User data not found.")
    # Log the export
    log = AuditLogEntry(
        id=str(len(USER_AUDIT_LOGS.get(user_id, [])) + 1),
        action="Data Export Request",
        timestamp=datetime.datetime.utcnow(),
        status="completed",
        details="User requested data export.",
    )
    USER_AUDIT_LOGS.setdefault(user_id, []).append(log)
    # Return as JSON
    return JSONResponse(content=user_data)

@router.post("/delete")
def delete_user_data(current_user: User = Depends(get_current_user)):
    user_id = getattr(current_user, 'id')
    if user_id in USER_DATA:
        del USER_DATA[user_id]
    # Log the deletion
    log = AuditLogEntry(
        id=str(len(USER_AUDIT_LOGS.get(user_id, [])) + 1),
        action="Data Deletion Request",
        timestamp=datetime.datetime.utcnow(),
        status="completed",
        details="User requested data deletion.",
    )
    USER_AUDIT_LOGS.setdefault(user_id, []).append(log)
    return {"detail": "User data deleted."}

@router.post("/consent")
def update_consent(req: ConsentUpdateRequest, current_user: User = Depends(get_current_user)):
    user_id = getattr(current_user, 'id')
    USER_CONSENTS[user_id] = req.dict(exclude_unset=True)
    # Log the consent update
    log = AuditLogEntry(
        id=str(len(USER_AUDIT_LOGS.get(user_id, [])) + 1),
        action="Consent Update",
        timestamp=datetime.datetime.utcnow(),
        status="completed",
        details="User updated consent preferences.",
    )
    USER_AUDIT_LOGS.setdefault(user_id, []).append(log)
    return {"detail": "Consent updated."}

@router.get("/audit-logs", response_model=List[AuditLogEntry])
def get_audit_logs(current_user: User = Depends(get_current_user)):
    user_id = getattr(current_user, 'id')
    return USER_AUDIT_LOGS.get(user_id, [])

@router.get("/audit-logs/csv")
def download_audit_logs_csv(current_user: User = Depends(get_current_user)):
    user_id = getattr(current_user, 'id')
    logs = USER_AUDIT_LOGS.get(user_id, [])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Action", "Timestamp", "Status", "Details"])
    for log in logs:
        writer.writerow([log.id, log.action, log.timestamp.isoformat(), log.status, log.details])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=audit-logs.csv"})
