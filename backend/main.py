from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from db import init_db
import os
import jwt
from contextlib import asynccontextmanager
from typing import Optional
import httpx

# Rate limiting setup - 100 requests per minute per IP (FR-005)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown

app = FastAPI(title="Todo App API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

FRONTEND_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme for JWT
security = HTTPBearer()

async def verify_jwt_token(token: str) -> dict:
    """
    Verify JWT token with Better Auth and return user information.
    This function contacts the Better Auth service to validate the token.
    """
    try:
        # In a real implementation, we would call the Better Auth API to verify the token
        # For now, we'll simulate the verification process
        # In production, this would be:
        # async with httpx.AsyncClient() as client:
        #     response = await client.post(
        #         f"{os.getenv('BETTER_AUTH_BASE_URL')}/api/getSession",
        #         headers={"Authorization": f"Bearer {token}"}
        #     )
        #     if response.status_code == 200:
        #         return response.json()
        #     else:
        #         raise HTTPException(status_code=401, detail="Invalid token")

        # For demo purposes, we'll decode the JWT locally
        # In a real app, you'd want to verify with Better Auth's public key
        secret = os.getenv("BETTER_AUTH_SECRET", "your-secret-key")
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Get current authenticated user from JWT token.
    """
    token = credentials.credentials
    user_data = await verify_jwt_token(token)
    return user_data

@app.get("/api/health")
@limiter.limit("100/minute")  # Apply rate limiting
async def health_check(request: Request):
    """
    Health check endpoint - public endpoint
    """
    return {"status": "healthy"}

# Include API routes
from routes import tasks, tags
from routes.auth import router as auth_router

app.include_router(auth_router)
app.include_router(tasks.router, dependencies=[Depends(get_current_user)])  # Apply JWT auth to all task routes
app.include_router(tags.router, dependencies=[Depends(get_current_user)])  # Apply JWT auth to all tag routes
