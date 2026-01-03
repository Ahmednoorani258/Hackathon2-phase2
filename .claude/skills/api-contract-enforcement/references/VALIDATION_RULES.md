# Validation Rules

Detailed explanation of all validation rules used in API contract enforcement.

## Overview

The validator checks contract compliance between OpenAPI specification and implementation using three main validation categories:

1. **Route/Method/Path Validation** - Endpoint existence and structure
2. **Request Payload Validation** - Request body and parameter schemas
3. **Response Payload Validation** - Response structure and status codes

## Route/Method/Path Validation

### Check: Endpoint Exists

**Rule:** Every path+method defined in OpenAPI spec must exist in implementation.

**Detection:**
- Spec: `/users` + `GET` → Impl must have route handler
- Spec: `/users/{id}` + `GET` → Impl must have route handler with path param

**Violations:**
```
✗ Endpoint GET /api/missing not found in implementation
```

**Fix:** Add missing route to implementation:
```python
@app.get("/api/missing")
async def get_missing():
    return {"status": "ok"}
```

### Check: HTTP Method Matches

**Rule:** HTTP methods must match exactly (case-insensitive).

**Valid Method Mappings:**
- `GET` in spec = `get()` in implementation
- `POST` in spec = `post()` in implementation
- `PUT` in spec = `put()` in implementation
- `PATCH` in spec = `patch()` in implementation
- `DELETE` in spec = `delete()` in implementation

**Violations:**
```
✗ GET /api/users found but implementation has POST method
```

### Check: Path Format Matches

**Rule:** URL paths must match exactly (FastAPI) or logically (Flask).

**Path Parameter Formats:**
- FastAPI: `/users/{id}` - uses curly braces
- Flask: `/users/<id>` - uses angle brackets

**Example Matches:**
| Spec Path | Impl Path (FastAPI) | Impl Path (Flask) |
|------------|---------------------|-------------------|
| `/users` | `/users` | `/users` |
| `/users/{id}` | `/users/{id}` | `/users/<id>` |
| `/users/{id}/posts/{postId}` | `/users/{id}/posts/{postId}` | `/users/<id>/posts/<postId>` |

**Violations:**
```
✗ Path mismatch: spec=/api/users/{id}, impl=/api/users/{user_id}
```

### Check: Path Parameters

**Rule:** All path parameters defined in spec must exist in implementation.

**Detection:**
1. Extract parameters from spec path: `users/{id}` → `['id']`
2. Extract parameters from impl path signature
3. Compare sets

**Violations:**
```
✗ Path parameter 'id' in spec but not in implementation
✗ Path parameter 'user_id' in implementation but not in spec
```

**Fix Examples:**
```python
# Fix missing parameter
@app.get("/users/{id}")  # Was: /users/{user_id}
async def get_user(id: int):  # Was: user_id
    return user

# Fix extra parameter
@app.get("/users")  # Was: /users/{extra}
async def get_users():
    return users
```

## Request Payload Validation

### Check: Request Body Presence

**Rule:** If spec defines `requestBody`, implementation must handle request body.

**Spec with Body:**
```yaml
post:
  requestBody:
    required: true
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/UserCreate'
```

**Expected Implementation:**
```python
@router.post("/users")
async def create_user(user: UserCreate):  # Request body param
    return user
```

**Violations:**
```
✗ Request body defined in spec but not in implementation
```

### Check: Request Body Schema Fields

**Rule:** All required fields in spec schema must be in implementation model.

**Spec Schema:**
```yaml
UserCreate:
  type: object
  required:
    - email
  properties:
    email:
      type: string
    name:
      type: string
```

**Expected Implementation:**
```python
class UserCreate(BaseModel):
    email: str  # Required
    name: Optional[str]  # Optional
```

**Violations:**
```
✗ Required field 'email' missing from request model
✗ Field type mismatch: spec=string, impl=integer
```

### Check: Request Body Required Fields

**Rule:** Fields marked `required: true` in spec must be required in implementation.

**Spec:**
```yaml
required:
  - email
  - password
```

**Implementation:**
```python
# Correct - both required
class UserCreate(BaseModel):
    email: str
    password: str

# Incorrect - password optional
class UserCreate(BaseModel):
    email: str
    password: Optional[str]
```

**Violations:**
```
✗ Field 'password' is required in spec but optional in implementation
```

### Check: Request Body Field Types

**Rule:** Field types must match between spec and implementation.

**Type Mappings:**
| OpenAPI Type | Python Type |
|--------------|-------------|
| `string` | `str` |
| `integer` | `int` |
| `number` | `float` |
| `boolean` | `bool` |
| `array` | `List[T]` |
| `object` | `Dict` or custom `BaseModel` |

**Format Mappings:**
| OpenAPI Format | Python Validation |
|----------------|-------------------|
| `email` | `EmailStr` (pydantic) |
| `uri` | `HttpUrl` (pydantic) |
| `date-time` | `datetime` |
| `uuid` | `UUID` |

**Violations:**
```
✗ Type mismatch for field 'age': spec=integer, impl=string
```

### Check: Request Body Nested Objects

**Rule:** Nested object structures must match.

**Spec:**
```yaml
properties:
  address:
    type: object
    properties:
      street: {type: string}
      city: {type: string}
```

**Implementation:**
```python
class Address(BaseModel):
    street: str
    city: str

class UserCreate(BaseModel):
    address: Address
```

### Check: Query Parameters

**Rule:** Query parameters in spec must be in implementation.

**Spec:**
```yaml
parameters:
  - name: page
    in: query
    required: false
    schema: {type: integer}
  - name: limit
    in: query
    required: false
    schema: {type: integer}
```

**Implementation:**
```python
@router.get("/users")
async def list_users(
    page: int = Query(1),
    limit: int = Query(20)
):
    pass
```

**Violations:**
```
✗ Query parameter 'page' in spec but not in implementation
```

## Response Payload Validation

### Check: Response Status Codes

**Rule:** All documented status codes must be returned by implementation.

**Spec:**
```yaml
responses:
  '200':
    description: Success
  '201':
    description: Created
  '404':
    description: Not found
```

**Implementation:**
```python
@router.get("/users/{id}", response_model=User)
async def get_user(id: int):
    user = db.get_user(id)
    if user:
        return user  # 200
    else:
        raise HTTPException(404)  # 404
```

**Violations:**
```
✗ Response 201 documented in spec but not in implementation
✗ Response 404 documented in spec but not returned by implementation
```

### Check: Response Schema Fields

**Rule:** Response structure must match documented schema.

**Spec Schema:**
```yaml
properties:
  id: {type: integer}
  email: {type: string}
  name: {type: string}
  created_at: {type: string, format: date-time}
```

**Implementation:**
```python
class User(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime
```

**Violations:**
```
✗ Response missing field 'name'
✗ Response extra field 'extra_field' not in spec
```

### Check: Response Field Types

**Rule:** Response field types must match spec.

**Violations:**
```
✗ Type mismatch in response field 'id': spec=integer, impl=string
```

### Check: Response Array Types

**Rule:** Array responses must have correct item types.

**Spec:**
```yaml
schema:
  type: array
  items:
    $ref: '#/components/schemas/User'
```

**Implementation:**
```python
@router.get("/users", response_model=List[User])  # Correct
async def list_users():
    return users
```

### Check: Error Response Schema

**Rule:** Error responses must follow documented error schema.

**Spec:**
```yaml
Error:
  type: object
  properties:
    error: {type: string}
    message: {type: string}
    code: {type: string}
```

**Implementation:**
```python
class ErrorResponse(BaseModel):
    error: str
    message: str
    code: str

# Return correct error
raise HTTPException(
    status_code=404,
    detail=ErrorResponse(
        error="Not found",
        message="User not found",
        code="USER_NOT_FOUND"
    ).model_dump()
)
```

## Framework-Specific Rules

### FastAPI

**Automatic Schema Extraction:**
- Pydantic models auto-generate OpenAPI schema
- Use `response_model` decorator parameter
- Use Pydantic `Field` for validation constraints

**FastAPI-Specific Checks:**
- `response_model` matches documented response schema
- Request models match `requestBody` schema
- Query parameters use `Query()` with same constraints

### Flask

**Manual Validation Required:**
- No automatic schema extraction
- Must manually verify request structure
- Must manually construct response structure

**Flask-Specific Checks:**
- Route decorator methods match HTTP methods
- Path parameters defined in route string
- Request body parsed from `request.json`
- Response is dict or JSON serializable

## Validation Modes

### Standard Mode

Checks for critical violations only:
- Missing endpoints
- Path parameter mismatches
- Request body presence
- Response status code presence

### Strict Mode

Includes all standard checks plus:
- Type mismatches (warnings in standard)
- Field validation constraints (min/max, pattern, etc.)
- Extra fields in responses
- Missing optional parameters

Use strict mode for production deployments:

```bash
python .claude/skills/api-contract-enforcement/scripts/validate_api_contract.py \
    openapi.yaml myapp.main --strict
```

## Severity Levels

### Critical (Violation)

Blocks deployment. Must fix before proceeding:
- Missing endpoints
- Path parameter mismatches
- Missing request/response bodies
- Incorrect HTTP methods

### Warning

Not blocking but should be addressed:
- Type mismatches
- Extra fields in responses
- Missing validation constraints
- Extra endpoints not in spec

## Troubleshooting

### False Positives

If you believe a violation is a false positive:

1. **Check spec accuracy** - Is spec the source of truth?
2. **Verify implementation** - Does implementation match intended behavior?
3. **Update spec or impl** - Whichever is outdated

### Common Patterns

**Pattern 1: Paginated Responses**

Spec: Single object with items and metadata
Impl: Return dict matching structure

```python
class PaginatedResponse(BaseModel):
    items: List[User]
    total: int
    page: int

@router.get("/users", response_model=PaginatedResponse)
async def list_users(page: int = 1, limit: int = 20):
    users = get_users(page, limit)
    return {
        "items": users,
        "total": count_users(),
        "page": page
    }
```

**Pattern 2: Nested Routes**

Spec: `/users/{userId}/posts/{postId}`
Impl: Match parameter names

```python
@router.get("/users/{user_id}/posts/{post_id}")
async def get_user_post(user_id: int, post_id: int):
    pass
```

**Pattern 3: Optional Fields**

Spec: Mark as optional (not in `required` array)
Impl: Use `Optional` or default value

```python
class UserUpdate(BaseModel):
    email: Optional[str] = None  # Optional field
```
