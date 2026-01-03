# Research: Better Auth & FastAPI Integration

Integrating Better Auth (Next.js) with a FastAPI backend using JWTs for multi-user isolation.

## Decision: JWT Plugin with JWKS Verification

**Decision**: Use the Better Auth **JWT Plugin** on the frontend and verify tokens on the FastAPI backend using the **JWKS (JSON Web Key Set)** endpoint.

**Rationale**:
- **Security**: Asymmetric encryption (EdDSA or ES256) ensures the backend can verify tokens without needing the private key used for signing.
- **Standards-Compliant**: Leverages OIDC patterns, making it easier to integrate other services later.
- **Decoupled**: Backend doesn't need a direct connection to the auth database; it only needs the public keys from the JWKS endpoint.

## Implementation Details

### 1. Backend Verification (FastAPI)
- **Tooling**: Use `PyJWT` with the `cryptography` backend or `Authlib`.
- **Key Discovery**: Fetch public keys from `https://<frontend-url>/api/auth/jwks`.
- **Caching**: Cache the JWKS for 24 hours to minimize latency.
- **Claims**: Validate `iss` (Issuer), `aud` (Audience), and `exp` (Expiration).

### 2. Identity Extraction
- **Claim**: The `sub` (subject) claim contains the Better Auth internal User ID.
- **SQLModel Integration**: Pass the extracted `user_id` into database session dependencies to enforce `WHERE user_id = :user_id` at the query level.

### 3. Shared Secret requirements
- `BETTER_AUTH_SECRET`: Only required on the frontend for signing.
- The backend only needs the public keys from the JWKS endpoint.

## Alternatives Considered

### Option A: Database Hook Sharing
- **Rationale**: Backend directly reads the sessions table.
- **Rejected because**: Increases database coupling and violates the stateless preference for the API.

### Option B: Shared HMAC Secret
- **Rationale**: Sign/Verify with a shared symmetric key.
- **Rejected because**: Better Auth prefers OIDC/Asymmetric patterns for the JWT plugin, which is more robust for service separation.

## Standard "sub" Field
Better Auth uses a unique string ID (typically a NanoID or UUID) in the `sub` claim. This will be stored as the `user_id` foreign key in the `Task` table.
