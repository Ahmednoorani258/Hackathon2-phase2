# OpenAPI Best Practices

Guidelines for writing clear, maintainable OpenAPI 3.x specifications.

## Structure and Organization

### File Organization

```yaml
openapi: 3.0.3
info:
  title: My API
  version: 1.0.0
  description: API for doing things
paths:
  # All endpoints defined here
components:
  schemas:
    # Reusable data models
  securitySchemes:
    # Authentication/authorization
```

### Grouping Endpoints

Use logical path prefixes:
```
/api/v1/users      # User resources
/api/v1/orders     # Order resources
/api/v1/products   # Product resources
/api/v1/admin      # Admin endpoints
```

## Path and Method Definitions

### Paths

- Use kebab-case for path segments: `/user-profiles` not `/user_profiles`
- Use plural nouns for collections: `/users` not `/user`
- Use singular for resource instances: `/users/{id}`
- Keep paths descriptive: `/users/{id}/orders` not `/userorders`

**Good:**
```yaml
/users
/users/{id}
/users/{id}/orders
/products/{productId}/reviews/{reviewId}
```

**Avoid:**
```yaml
/user            # Inconsistent pluralization
/getUsers        # Verbs in paths
/u/{i}/o         # Cryptic abbreviations
```

### HTTP Methods

Use HTTP methods correctly:
- `GET`: Retrieve resources (no side effects)
- `POST`: Create new resources
- `PUT`: Update entire resource
- `PATCH`: Partial update
- `DELETE`: Remove resource

**Good:**
```yaml
GET    /users           # List users
GET    /users/{id}       # Get specific user
POST   /users           # Create user
PUT    /users/{id}       # Replace user
PATCH  /users/{id}       # Update user partially
DELETE /users/{id}       # Delete user
```

## Parameters

### Path Parameters

- Document required vs optional
- Include data types
- Add descriptions

```yaml
/users/{id}:
  get:
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: integer
        description: Unique user identifier
```

### Query Parameters

- Group related parameters
- Document defaults
- Specify constraints

```yaml
/users:
  get:
    parameters:
      - name: page
        in: query
        required: false
        schema:
          type: integer
          minimum: 1
          default: 1
        description: Page number for pagination
      - name: limit
        in: query
        required: false
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
        description: Items per page
```

### Request Body

- Use `content` with media type
- Reference reusable schemas
- Document required fields

```yaml
/users:
  post:
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UserCreate'
          examples:
            basic:
              summary: Basic user
              value:
                email: "user@example.com"
                name: "John Doe"
```

## Response Definitions

### Success Responses

- Document all success status codes
- Include response schemas
- Provide examples

```yaml
/users:
  get:
    responses:
      '200':
        description: List of users retrieved successfully
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/User'
            example:
              - id: 1
                email: "user1@example.com"
                name: "User One"
              - id: 2
                email: "user2@example.com"
                name: "User Two"
```

### Error Responses

- Document common error codes (400, 401, 403, 404, 422, 500)
- Use consistent error schema
- Provide clear error messages

```yaml
/users:
  get:
    responses:
      '400':
        description: Bad request - invalid query parameters
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
            example:
              error: "Invalid parameter"
              message: "'limit' must be between 1 and 100"
              code: "INVALID_QUERY_PARAM"
      '404':
        description: User not found
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Error'
            example:
              error: "Not found"
              message: "User with id 123 does not exist"
              code: "USER_NOT_FOUND"
```

## Schema Definitions

### Reusable Components

Define common schemas in `components/schemas`:

```yaml
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          example: 1
        email:
          type: string
          format: email
          example: "user@example.com"
        name:
          type: string
          example: "John Doe"
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - email

    UserCreate:
      type: object
      properties:
        email:
          type: string
          format: email
        name:
          type: string
      required:
        - email

    Error:
      type: object
      properties:
        error:
          type: string
          description: Short error description
          example: "Not found"
        message:
          type: string
          description: Detailed error message
          example: "Resource not found"
        code:
          type: string
          description: Machine-readable error code
          example: "RESOURCE_NOT_FOUND"
      required:
        - error
        - code
```

### Data Types

Use appropriate types:
- `string` for text
- `integer` for whole numbers
- `number` for decimals
- `boolean` for true/false
- `array` for lists
- `object` for dictionaries

Add formats for validation:
- `date-time`: ISO 8601 datetime
- `date`: ISO 8601 date
- `email`: Email address
- `uri`: URL/URI
- `uuid`: UUID format

Add constraints:
- `minimum`, `maximum`: Number ranges
- `minLength`, `maxLength`: String length
- `pattern`: Regex pattern
- `enum`: Fixed set of values

```yaml
schema:
  type: object
  properties:
    email:
      type: string
      format: email
      minLength: 5
      maxLength: 255
    age:
      type: integer
      minimum: 0
      maximum: 150
    status:
      type: string
      enum: [active, inactive, pending]
```

## Authentication and Authorization

### API Keys

```yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

security:
  - ApiKeyAuth: []
```

### JWT Bearer Token

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

### OAuth2

```yaml
components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: /oauth/authorize
          tokenUrl: /oauth/token
          scopes:
            read: Read access
            write: Write access
```

## Documentation

### Info Section

```yaml
info:
  title: User Management API
  version: 1.0.0
  description: |
    API for managing users in the system.

    Features:
    - User CRUD operations
    - Search and filtering
    - Email verification

  contact:
    name: API Support
    email: api@example.com

  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
```

### Tags

Group endpoints with tags:

```yaml
tags:
  - name: users
    description: User management operations
  - name: orders
    description: Order management operations

paths:
  /users:
    get:
      tags:
        - users
      summary: List users
```

### Descriptions

- Write clear descriptions
- Include examples
- Document edge cases

```yaml
/users/{id}:
  get:
    summary: Get user by ID
    description: |
      Retrieves a specific user by their unique identifier.

      **Note**: If the user doesn't exist, returns 404.

      **Authentication**: Requires valid API key.
    operationId: getUserById
```

## Versioning

### URL Versioning

```yaml
/api/v1/users
/api/v2/users
```

### Header Versioning

```yaml
/users:
  get:
    parameters:
      - name: API-Version
        in: header
        required: true
        schema:
          type: string
          enum: [1.0, 2.0]
```

## Common Pitfalls to Avoid

### ❌ Inconsistent Naming
```yaml
/users           # Good
/user            # Bad - inconsistent pluralization
/getUsers        # Bad - verb in path
```

### ❌ Missing Error Responses
```yaml
responses:
  '200':
    description: Success
  # Missing: 400, 401, 404, 500
```

### ❌ Hardcoded Values in Paths
```yaml
/users/active    # Bad - use query parameter instead
/users?status=active  # Good
```

### ❌ Vague Descriptions
```yaml
description: "Gets user"      # Bad
description: "Retrieves user by unique identifier"  # Good
```

### ❌ Non-Reusable Schemas
```yaml
# Bad - inline definition
schema:
  type: object
  properties:
    id:
      type: integer
    email:
      type: string

# Good - reusable component
schema:
  $ref: '#/components/schemas/User'
```
