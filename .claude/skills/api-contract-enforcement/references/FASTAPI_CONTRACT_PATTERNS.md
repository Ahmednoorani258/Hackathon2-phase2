# FastAPI Contract Patterns

Common patterns for implementing contract-compliant FastAPI endpoints that match OpenAPI specifications.

## Basic Endpoint Structure

### GET Request (List)

**OpenAPI Spec:**
```yaml
/users:
  get:
    summary: List users
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: limit
        in: query
        schema:
          type: integer
          default: 20
    responses:
      '200':
        description: List of users
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/User'
```

**FastAPI Implementation:**
```python
from fastapi import APIRouter, Query
from typing import List

router = APIRouter()

class User(BaseModel):
    id: int
    email: str
    name: Optional[str]

@router.get("/users", response_model=List[User])
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
):
    """List all users with pagination."""
    offset = (page - 1) * limit
    users = db.query(UserModel).offset(offset).limit(limit).all()
    return users
```

### POST Request (Create)

**OpenAPI Spec:**
```yaml
/users:
  post:
    summary: Create user
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UserCreate'
    responses:
      '201':
        description: User created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      '400':
        description: Validation error
```

**FastAPI Implementation:**
```python
from fastapi import APIRouter, status

class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None

@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate):
    """Create a new user."""
    user = db.add(UserModel(
        email=user_data.email,
        name=user_data.name
    ))
    db.commit()
    return user
```

### GET Request by ID

**OpenAPI Spec:**
```yaml
/users/{id}:
  get:
    summary: Get user by ID
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
    responses:
      '200':
        description: User details
      '404':
        description: User not found
```

**FastAPI Implementation:**
```python
from fastapi import APIRouter, Path, HTTPException

@router.get("/users/{user_id}", response_model=User)
async def get_user(
    user_id: int = Path(..., gt=0, description="User ID")
):
    """Get user by ID."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

### PUT Request (Update)

**OpenAPI Spec:**
```yaml
/users/{id}:
  put:
    summary: Update user
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UserUpdate'
    responses:
      '200':
        description: User updated
      '404':
        description: User not found
```

**FastAPI Implementation:**
```python
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None

@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    user_data: UserUpdate
):
    """Update user completely."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.email = user_data.email or user.email
    user.name = user_data.name if user_data.name is not None else user.name
    db.commit()

    return user
```

### PATCH Request (Partial Update)

**OpenAPI Spec:**
```yaml
/users/{id}:
  patch:
    summary: Partially update user
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UserPatch'
    responses:
      '200':
        description: User updated
```

**FastAPI Implementation:**
```python
class UserPatch(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None

    class Config:
        # Allow partial updates
        extra = "forbid"

@router.patch("/users/{user_id}", response_model=User)
async def patch_user(
    user_id: int,
    user_data: UserPatch
):
    """Partially update user."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    return user
```

### DELETE Request

**OpenAPI Spec:**
```yaml
/users/{id}:
  delete:
    summary: Delete user
    responses:
      '204':
        description: User deleted
      '404':
        description: User not found
```

**FastAPI Implementation:**
```python
from fastapi import status

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int):
    """Delete user."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return None  # FastAPI handles 204 No Content
```

## Pydantic Models for Schemas

### Request Models

```python
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    """Model for creating a new user."""
    email: EmailStr = Field(..., description="User email address")
    name: Optional[str] = Field(None, max_length=200, description="User name")
    password: str = Field(..., min_length=8, description="Password")

    @validator('name')
    def name_must_not_be_blank(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Name cannot be blank')
        return v

class UserUpdate(BaseModel):
    """Model for updating a user (all fields optional)."""
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, max_length=200)
    password: Optional[str] = Field(None, min_length=8)
```

### Response Models

```python
class User(BaseModel):
    """Model for user response."""
    id: int
    email: str
    name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True  # For ORM compatibility

class UserListResponse(BaseModel):
    """Model for paginated user list."""
    items: List[User]
    total: int
    page: int
    limit: int
    has_next: bool
```

### Error Models

```python
class ErrorDetail(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Short error description")
    message: str = Field(..., description="Detailed error message")
    code: str = Field(..., description="Machine-readable error code")

# Custom exception
class APIError(HTTPException):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(
            status_code=status_code,
            detail={"error": code, "message": message, "code": code}
        )
```

## Authentication

### JWT Bearer Auth

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

# Protected endpoint
@router.get("/users/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return current_user
```

## Validation

### Query Parameter Validation

```python
from fastapi import Query, Path
from typing import List

@router.get("/users")
async def search_users(
    q: Optional[str] = Query(None, min_length=1, max_length=50, description="Search query"),
    status: Optional[str] = Query(None, regex="^(active|inactive|pending)$", description="User status"),
    sort: str = Query("created_at", description="Sort field"),
    order: str = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page")
):
    """Search users with filtering and sorting."""
    pass
```

### Path Parameter Validation

```python
@router.get("/users/{user_id}")
async def get_user(
    user_id: int = Path(..., gt=0, description="User ID must be positive")
):
    pass
```

### Request Body Validation

```python
class UserCreate(BaseModel):
    email: EmailStr
    age: int = Field(..., ge=0, le=150)
    role: str = Field(..., regex="^(admin|user|guest)$")

    @validator('email')
    def email_must_be_unique(cls, v):
        if db.query(UserModel).filter(UserModel.email == v).first():
            raise ValueError('Email already registered')
        return v
```

## Error Handling

### Custom Exceptions

```python
from fastapi import Request
from fastapi.responses import JSONResponse

class UserNotFoundError(HTTPException):
    def __init__(self):
        super().__init__(status_code=404, detail="User not found")

class ValidationError(HTTPException):
    def __init__(self, message: str):
        super().__init__(status_code=422, detail=message)

# Global exception handler
@app.exception_handler(UserNotFoundError)
async def user_not_found_handler(request: Request, exc: UserNotFoundError):
    return JSONResponse(
        status_code=404,
        content={
            "error": "USER_NOT_FOUND",
            "message": str(exc.detail),
            "code": "USER_NOT_FOUND"
        }
    )
```

### Using Exception Handlers

```python
@router.get("/users/{user_id}")
async def get_user(user_id: int):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise UserNotFoundError()
    return user
```

## Best Practices

### 1. Use Response Models

Always specify `response_model` to ensure OpenAPI spec is accurate:

```python
@router.get("/users/{user_id}", response_model=User)  # Good
async def get_user(user_id: int):
    pass

@router.get("/users/{user_id}")  # Bad - no response model
async def get_user(user_id: int):
    pass
```

### 2. Separate Request/Response Models

Different models for input and output:

```python
class UserCreate(BaseModel):   # Request - no id, no created_at
    email: EmailStr
    name: str

class User(BaseModel):         # Response - has id and created_at
    id: int
    email: str
    name: str
    created_at: datetime
```

### 3. Use Field Descriptions

Add descriptions to all fields:

```python
class User(BaseModel):
    id: int = Field(..., description="Unique user identifier")
    email: EmailStr = Field(..., description="User email address")
    name: Optional[str] = Field(None, description="User full name")
```

### 4. Validate Early

Validate inputs at the API boundary:

```python
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

    @validator('password')
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        return v
```

### 5. Use HTTP Status Codes Correctly

```python
from fastapi import status

# Create: 201 Created
@router.post("/users", status_code=status.HTTP_201_CREATED)

# Delete: 204 No Content
@router.delete("/users/{id}", status_code=status.HTTP_204_NO_CONTENT)

# Update: 200 OK
@router.put("/users/{id}")

# Validation error: 422 Unprocessable Entity (automatic)
```

### 6. Document with Docstrings

```python
@router.get("/users", response_model=List[User])
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """
    List all users with pagination.

    Args:
        page: Page number (1-indexed)
        limit: Number of items per page

    Returns:
        List of users

    Raises:
        HTTPException: If page or limit is invalid
    """
    pass
```
