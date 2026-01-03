"""
Authentication routes for the Todo API

This module implements JWT-based authentication:
- Sign up: Creates a new user and returns a JWT token
- Sign in: Validates credentials and returns a JWT token
- Sign out: Clears the session cookie
- Session: Returns the current session info
"""

import os
import jwt
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Request, HTTPException, Depends, Security, APIRouter, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from dotenv import load_dotenv
from sqlmodel import Session, select

# Import models and database
from models import User
from db import get_session

load_dotenv()

# Configuration
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET", "").strip().strip('"')
if not BETTER_AUTH_SECRET:
    raise ValueError("BETTER_AUTH_SECRET environment variable is required")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Create router
router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

# Pydantic model for user context
class UserContext(BaseModel):
    user_id: str
    email: str
    name: str


# ==================== Password Functions ====================

def hash_password(password: str) -> str:
    """Hash password using argon2."""
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against argon2 hash."""
    return pwd_context.verify(password, hashed_password)


# ==================== JWT Functions ====================

def create_access_token(user_id: str, email: str, name: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT token for the user."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": datetime.utcnow(),
        "exp": expire,
    }
    return jwt.encode(payload, BETTER_AUTH_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(
            token,
            BETTER_AUTH_SECRET,
            algorithms=[ALGORITHM],
            options={"verify_signature": True, "verify_exp": True}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> UserContext:
    """
    Get current authenticated user from JWT token.
    This function is used as a dependency in other routes to enforce authentication.
    """
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        email = payload.get("email")
        name = payload.get("name")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return UserContext(user_id=user_id, email=email, name=name)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ==================== Request/Response Models ====================

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str


class SessionResponse(BaseModel):
    user: UserResponse
    token: str


class MessageResponse(BaseModel):
    message: str


# ==================== Auth Endpoints ====================

@router.post("/sign-up", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def sign_up(request: SignUpRequest, response: Response, db_session: Session = Depends(get_session)):
    """Create a new user account and return a JWT token."""
    
    # Check if user already exists
    statement = select(User).where(User.email == request.email)
    existing_user = db_session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash password
    password_hash = hash_password(request.password)

    # Create user - ID will be auto-generated by default_factory
    user = User(
        email=request.email,
        name=request.name,
        password_hash=password_hash,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Create JWT token
    token = create_access_token(user.id, user.email, user.name)

    # Set cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=False,  # Set to False for localhost development
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
    )

    return SessionResponse(
        user=UserResponse(id=user.id, email=user.email, name=user.name),
        token=token,
    )


@router.post("/sign-in", response_model=SessionResponse)
async def sign_in(request: SignInRequest, response: Response, db_session: Session = Depends(get_session)):
    """Authenticate user and return a JWT token."""
    
    # Check if user exists
    statement = select(User).where(User.email == request.email)
    user = db_session.exec(statement).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create JWT token
    token = create_access_token(user.id, user.email, user.name)

    # Set cookie
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=False,  # Set to False for localhost development
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
    )

    return SessionResponse(
        user=UserResponse(id=user.id, email=user.email, name=user.name),
        token=token,
    )


@router.post("/sign-out", response_model=MessageResponse)
async def sign_out(response: Response):
    """Clear the session cookie."""
    response.delete_cookie(
        key="auth_token",
        httponly=True,
        secure=False,
        samesite="lax",
    )
    return MessageResponse(message="Signed out successfully")


@router.get("/session", response_model=SessionResponse)
async def get_session_info(request: Request):
    """Get the current session info."""
    
    authorization: Optional[str] = request.headers.get("Authorization")
    token = None

    # Try to get token from Authorization header first
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    else:
        # Try to get token from cookies
        token = request.cookies.get("auth_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        return SessionResponse(
            user=UserResponse(
                id=user_id,
                email=payload.get("email", ""),
                name=payload.get("name", ""),
            ),
            token=token,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )


# ==================== Helper Functions for Task Routes ====================

class UserContext(BaseModel):
    """User context extracted from JWT token"""
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None


async def get_current_user(request: Request) -> UserContext:
    """
    Dependency to extract and verify current user from JWT token.
    Can be used with Depends() in route handlers.
    """
    authorization: Optional[str] = request.headers.get("Authorization")
    token = None

    # Try to get token from Authorization header first
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
    else:
        # Try to get token from cookies
        token = request.cookies.get("auth_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        return UserContext(
            user_id=user_id,
            email=payload.get("email"),
            name=payload.get("name"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )