# --- Profile Photo Upload Endpoint ---
# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
import secrets
import os
import shutil
from db import SessionLocal, User
from pydantic import BaseModel


# --- Password Reset (Forgot Password) ---
from datetime import datetime, timedelta

# In-memory store for reset tokens (for demo; use DB in production)
password_reset_tokens = {}

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Place these endpoints after auth_router is defined
# ...existing code...



SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

auth_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

class UserProfile(BaseModel):
    username: str
    email: str

# Move get_db above get_current_user to fix NameError

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise credentials_exception
        return user
    except Exception:
        raise credentials_exception

@auth_router.get("/profile", response_model=UserProfile)
def get_profile(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "email": current_user.email}

from fastapi import Request

@auth_router.put("/profile", response_model=UserProfile)
def update_profile(
    profile: UserProfile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only allow updating username/email, not password here
    if profile.username != current_user.username:
        # Check if new username is taken
        if db.query(User).filter(User.username == profile.username).first():
            raise HTTPException(status_code=400, detail="Username already taken")
        setattr(current_user, "username", profile.username)
    if profile.email != current_user.email:
        # Check if new email is taken
        if db.query(User).filter(User.email == profile.email).first():
            raise HTTPException(status_code=400, detail="Email already taken")
        setattr(current_user, "email", profile.email)
    db.commit()
    db.refresh(current_user)
    return {"username": current_user.username, "email": current_user.email}



def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_api_key() -> str:
    return secrets.token_urlsafe(24)

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    username: str
    email: str
    password: str

@auth_router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter((User.username == req.username) | (User.email == req.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already registered.")
    hashed_pw = hash_password(req.password)
    api_key = create_api_key()
    user = User(username=req.username, email=req.email, hashed_password=hashed_pw, api_key=api_key)
    db.add(user)
    db.commit()
    db.refresh(user)
    # Send welcome email
    import os, smtplib
    from email.mime.text import MIMEText
    smtp_server = os.getenv("SMTP_SERVER") or ""
    smtp_port = os.getenv("SMTP_PORT") or ""
    smtp_user = os.getenv("SMTP_USER") or ""
    smtp_password = os.getenv("SMTP_PASSWORD") or ""
    email_from = os.getenv("EMAIL_FROM") or ""
    try:
        smtp_port_int = int(smtp_port)
        email_to = str(user.email)
        msg = MIMEText(f"Welcome to AyvCodr, {user.username}! Your account has been created. Dream big, build boldly, and change the world!")
        msg["Subject"] = "Welcome to AyvCodr!"
        msg["From"] = email_from or ""
        msg["To"] = email_to
        with smtplib.SMTP(smtp_server, smtp_port_int) as server:
            server.starttls()
            server.login(smtp_user or "", smtp_password or "")
            server.sendmail(email_from or "", [email_to], msg.as_string())
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
    # Create JWT token for immediate login
    from jose import jwt
    SECRET_KEY = "supersecretkey"
    ALGORITHM = "HS256"
    token = jwt.encode({"sub": user.username}, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "username": user.username,
        "email": user.email,
        "api_key": user.api_key,
        "access_token": token,
        "token_type": "bearer"
    }



class LoginRequest(BaseModel):
    username: str
    password: str

# Move profile photo endpoint below auth_router definition
@auth_router.post("/profile/photo")
def upload_profile_photo(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ext = file.filename.split('.')[-1] if file.filename else 'jpg'
    filename = f"{current_user.username}.{ext}"
    save_dir = "profile_photos"
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    # Return direct URL for frontend display
    photo_url = f"/profile_photos/{filename}"
    return {"photoUrl": photo_url}


@auth_router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter((User.username == req.username) | (User.email == req.username)).first()
    if not user or not verify_password(req.password, getattr(user, "hashed_password")):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    token = jwt.encode({"sub": user.username}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "api_key": user.api_key}


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

@auth_router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
        if not pwd_context.verify(req.old_password, getattr(current_user, "hashed_password")):
            raise HTTPException(status_code=401, detail="Old password is incorrect")
        setattr(current_user, "hashed_password", pwd_context.hash(req.new_password))
        db.commit()
        return {"msg": "Password updated successfully"}
@auth_router.delete("/delete-account")
def delete_account(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.delete(current_user)
    db.commit()
    return {"msg": "Account deleted successfully"}

# --- Admin/User Listing Endpoints ---
from typing import List

class UserOut(BaseModel):
    id: int
    username: str
    email: str

@auth_router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [UserOut(id=getattr(u, "id"), username=getattr(u, "username"), email=getattr(u, "email")) for u in users]

@auth_router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        return UserOut(id=getattr(user, "id"), username=getattr(user, "username"), email=getattr(user, "email"))


# --- Usage Analytics Endpoints (Demo) ---
usage_stats = {}

@auth_router.get("/usage/me")
def get_my_usage(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "usage_count": usage_stats.get(current_user.username, 0)}

@auth_router.get("/usage/all")
def get_all_usage():
    return usage_stats

@auth_router.post("/request-password-reset")
def request_password_reset(req: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")
    token = secrets.token_urlsafe(16)
    # Store token with expiry (15 min)
    password_reset_tokens[token] = {"user_id": user.id, "expires": datetime.utcnow() + timedelta(minutes=15)}
    # Simulate sending email by returning token in response (for demo)
    return {"msg": "Password reset token generated (simulate email)", "reset_token": token}

@auth_router.post("/reset-password")
def reset_password(req: PasswordResetConfirm, db: Session = Depends(get_db)):
    token_data = password_reset_tokens.get(req.token)
    if not token_data or token_data["expires"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    setattr(user, "hashed_password", pwd_context.hash(req.new_password))
    db.commit()
    # Remove token after use
    del password_reset_tokens[req.token]
    return {"msg": "Password has been reset successfully"}
