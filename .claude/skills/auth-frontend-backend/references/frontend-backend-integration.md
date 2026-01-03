# Frontend-Backend Integration Patterns with Better Auth

## Overview

This document provides comprehensive patterns for integrating Next.js frontend with FastAPI backend using Better Auth as the authentication provider. The focus is on secure, user-isolated communication with JWT tokens and rate limiting.

## Architecture Patterns

### 1. API Gateway Pattern

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │  Better Auth    │    │   FastAPI       │
│   Frontend      │◄──►│  (Authentication│◄──►│   Backend       │
│                 │    │  Provider)      │    │                 │
│  - UI Layer     │    │  - JWT Gen/Ver  │    │  - Business     │
│  - API Client   │    │  - User Mgmt    │    │    Logic        │
│  - State Mgmt   │    │  - Session Mgmt │    │  - Data Access  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. Direct Integration Pattern

For simpler applications where the frontend communicates directly with both the auth provider and backend:

```
┌─────────────────┐
│   Next.js       │
│   Frontend      │
│                 │
│  ┌─────────────┐ │
│  │ Auth Client │ │◄────┐
│  └─────────────┘ │     │
└─────────────────┘     │
                        │
                        ▼
        ┌─────────────────────────────┐
        │  Better Auth (Authentication│
        │  Provider)                  │
        └─────────────────────────────┘
                        │
                        ▼
        ┌─────────────────────────────┐
        │   FastAPI Backend           │
        │  - JWT Validation           │
        │  - Business Logic           │
        │  - Rate Limiting            │
        └─────────────────────────────┘
```

## Next.js 16 Integration Patterns

### 1. App Router Integration

#### Server Components with Authentication

```typescript
// app/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
      <UserSpecificContent userId={session.user.id} />
    </div>
  );
}

// Child component that receives user ID for isolation
async function UserSpecificContent({ userId }: { userId: string }) {
  // Fetch user-specific data using the provided user ID
  // This ensures data isolation
  const data = await fetchUserData(userId);

  return (
    <div>
      <h2>Your Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

#### Client Components with Authentication Context

```typescript
// components/AuthProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getJwtToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await authClient.getSession();
      setUser(session.data?.session?.user || null);
    } catch (error) {
      console.error("Session check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });

    if (result.data?.session) {
      setUser(result.data.session.user);
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
  };

  const getJwtToken = async (): Promise<string> => {
    const result = await authClient.jwt.generate();
    if (result.error) {
      throw new Error(result.error.message);
    }
    return result.data?.token || "";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, getJwtToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

### 2. API Route Integration

#### Authentication Middleware for API Routes

```typescript
// lib/api-middleware.ts
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      authenticated: false,
      error: "Missing or invalid authorization header",
      status: 401,
    };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await auth.jwt.verify(token);
    return {
      authenticated: true,
      userId: decoded.userId,
      token: decoded,
    };
  } catch (error) {
    return {
      authenticated: false,
      error: "Invalid or expired token",
      status: 401,
    };
  }
}

export async function requireUserIsolation(
  request: NextRequest,
  requiredUserId: string
) {
  const authResult = await requireAuth(request);

  if (!authResult.authenticated) {
    return authResult;
  }

  if (authResult.userId !== requiredUserId) {
    return {
      authenticated: true, // User is authenticated but not authorized
      authorized: false,
      error: "Access denied: Cannot access other user's data",
      status: 403,
    };
  }

  return {
    ...authResult,
    authorized: true,
  };
}
```

#### Protected API Routes

```typescript
// app/api/users/[id]/route.ts
import { NextRequest } from "next/server";
import { requireUserIsolation } from "@/lib/api-middleware";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if user is authenticated and authorized to access this user's data
  const authResult = await requireUserIsolation(request, params.id);

  if (!authResult.authenticated) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  if (!authResult.authorized) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  // User is authenticated and authorized, return user data
  const userData = await getUserData(params.id);

  return Response.json({
    user: userData,
    accessedBy: authResult.userId,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Same authentication and authorization check
  const authResult = await requireUserIsolation(request, params.id);

  if (!authResult.authenticated) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  if (!authResult.authorized) {
    return Response.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const body = await request.json();
  const updatedUser = await updateUserData(params.id, body);

  return Response.json({
    user: updatedUser,
    updatedBy: authResult.userId,
  });
}
```

## FastAPI Integration Patterns

### 1. Dependency Injection for Authentication

```python
# dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import Optional
import httpx
import os
import jwt
from pydantic import BaseModel

security = HTTPBearer()

class User(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str = "user"

async def get_current_user(credentials=Depends(security)) -> User:
    """
    Dependency to get current authenticated user from JWT token
    """
    token = credentials.credentials

    try:
        # Verify token with Better Auth
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{os.getenv('BETTER_AUTH_BASE_URL')}/api/getSession",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )

        if response.status_code == 200:
            session_data = response.json()
            return User(
                id=session_data["user"]["id"],
                email=session_data["user"]["email"],
                name=session_data["user"]["name"],
                role=session_data["user"].get("role", "user")
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )

# Reusable dependency for current user
CurrentUser = Depends(get_current_user)
```

### 2. User Isolation in Database Queries

```python
# database.py
from sqlalchemy.orm import Session
from sqlalchemy import and_
from models import Task, User as UserModel

def get_user_tasks(db: Session, user_id: str) -> list:
    """
    Get tasks for a specific user only
    """
    return db.query(Task).filter(Task.user_id == user_id).all()

def get_task_by_id(db: Session, task_id: int, user_id: str) -> Task:
    """
    Get a specific task that belongs to the user
    """
    return db.query(Task).filter(
        and_(Task.id == task_id, Task.user_id == user_id)
    ).first()

def update_task(db: Session, task_id: int, user_id: str, **updates) -> Task:
    """
    Update a task that belongs to the user
    """
    task = get_task_by_id(db, task_id, user_id)
    if not task:
        raise ValueError("Task not found or does not belong to user")

    for field, value in updates.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task
```

### 3. Service Layer with User Isolation

```python
# services.py
from typing import List, Optional
from sqlalchemy.orm import Session
from .database import get_user_tasks, get_task_by_id, update_task
from .models import TaskCreate, TaskUpdate, Task

class TaskService:
    def __init__(self, db: Session):
        self.db = db

    async def get_user_tasks(self, user_id: str) -> List[Task]:
        """
        Get all tasks for the authenticated user
        """
        return get_user_tasks(self.db, user_id)

    async def get_task(self, task_id: int, user_id: str) -> Optional[Task]:
        """
        Get a specific task that belongs to the user
        """
        return get_task_by_id(self.db, task_id, user_id)

    async def create_task(self, user_id: str, task_data: TaskCreate) -> Task:
        """
        Create a task for the authenticated user
        """
        task = Task(user_id=user_id, **task_data.dict())
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    async def update_task(self, task_id: int, user_id: str, task_data: TaskUpdate) -> Task:
        """
        Update a task that belongs to the user
        """
        return update_task(self.db, task_id, user_id, **task_data.dict(exclude_unset=True))

    async def delete_task(self, task_id: int, user_id: str) -> bool:
        """
        Delete a task that belongs to the user
        """
        task = get_task_by_id(self.db, task_id, user_id)
        if not task:
            return False

        self.db.delete(task)
        self.db.commit()
        return True
```

## Cross-Origin Resource Sharing (CORS) Configuration

### Next.js Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ["better-auth"],
  },
};

module.exports = nextConfig;
```

### FastAPI CORS Configuration

```python
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # Expose the authorization header to the frontend
    expose_headers=["Authorization"],
)
```

## Error Handling Patterns

### Next.js Error Handling

```typescript
// lib/error-handler.ts
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function handleApiError(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `HTTP error! status: ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return response;
}

// In API client
export async function secureApiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getJwtToken();

  const response = await fetch(`/api/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token might be expired, redirect to login
    window.location.href = "/login";
    throw new ApiError("Authentication required", 401);
  }

  await handleApiError(response);
  return response.json();
}
```

### FastAPI Error Handling

```python
# exceptions.py
from fastapi import HTTPException, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "message": "Validation error",
            "details": exc.errors()
        }
    )

async def custom_http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

# In main app
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, custom_http_exception_handler)
```

## Performance Optimization

### API Response Caching

```typescript
// lib/cache.ts
class ApiCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ApiCache();
```

### Server-Side Request Batching

```python
# services/batch_service.py
from typing import List, Dict, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor

class BatchService:
    def __init__(self, max_workers: int = 10):
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

    async def batch_get_user_data(self, user_ids: List[str]) -> Dict[str, Any]:
        """
        Batch fetch user data to reduce database queries
        """
        loop = asyncio.get_event_loop()
        # Use the executor to run CPU-bound operations in a thread pool
        results = await loop.run_in_executor(
            self.executor,
            self._sync_batch_fetch,
            user_ids
        )
        return results

    def _sync_batch_fetch(self, user_ids: List[str]) -> Dict[str, Any]:
        """
        Synchronous batch fetch implementation
        """
        # Implementation here
        pass
```

These patterns ensure secure, scalable, and maintainable integration between Next.js frontend and FastAPI backend with proper user isolation and authentication handling.