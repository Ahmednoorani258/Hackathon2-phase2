# JWT Token Security and Rate Limiting Patterns

## JWT Security Best Practices

### 1. Token Generation and Validation

#### Secure JWT Generation with Better Auth

```typescript
// lib/secure-jwt.ts
import { auth } from "@/lib/auth";

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;  // Issued at
  exp: number;  // Expiration
  jti: string;  // JWT ID for revocation
}

export async function generateSecureToken(
  userId: string,
  email: string,
  role: string = "user",
  permissions: string[] = []
): Promise<string> {
  const payload: JwtPayload = {
    userId,
    email,
    role,
    permissions,
    iat: Math.floor(Date.now() / 1000),  // Current time in seconds
    exp: Math.floor(Date.now() / 1000) + (15 * 60),  // 15 minutes from now
    jti: generateJwtId()  // Unique ID for potential revocation
  };

  // Use Better Auth's JWT signing capability
  return await auth.jwt.sign(payload);
}

function generateJwtId(): string {
  // Generate a unique ID for the JWT (for potential future revocation)
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export async function validateToken(token: string): Promise<JwtPayload> {
  try {
    const decoded = await auth.jwt.verify(token);
    return decoded as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
```

#### JWT Validation with Revocation Check

```typescript
// lib/jwt-validation.ts
import { validateToken, JwtPayload } from "@/lib/secure-jwt";

// In-memory store for revoked tokens (use Redis in production)
const revokedTokens = new Set<string>();

export async function validateAndCheckRevocation(token: string): Promise<JwtPayload> {
  // First, validate the JWT signature and expiration
  const payload = await validateToken(token);

  // Check if token has been revoked
  if (revokedTokens.has(payload.jti)) {
    throw new Error("Token has been revoked");
  }

  return payload;
}

export function revokeToken(jti: string): void {
  revokedTokens.add(jti);
  // In production, you might want to clear the token after some time
  setTimeout(() => revokedTokens.delete(jti), 24 * 60 * 60 * 1000); // 24 hours
}
```

### 2. Token Refresh Strategy

#### Secure Token Refresh Implementation

```typescript
// lib/token-refresh.ts
import { auth } from "@/lib/auth";

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  exp: number;
}

export async function generateRefreshToken(
  userId: string,
  sessionId: string
): Promise<string> {
  const payload: RefreshTokenPayload = {
    userId,
    sessionId,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };

  // For refresh tokens, you might want to use a different signing key
  // or implement with Better Auth's session system
  return await auth.jwt.sign(payload, {
    expiresIn: "7d"
  });
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    // Validate refresh token
    const refreshPayload = await auth.jwt.verify(refreshToken) as RefreshTokenPayload;

    // In a real implementation, you'd check if the session is still valid
    // and hasn't been revoked

    // Generate new access token
    const newAccessToken = await generateSecureToken(
      refreshPayload.userId,
      // You'd get the email from your user store
      "user@example.com"
    );

    // Generate new refresh token to rotate it
    const newRefreshToken = await generateRefreshToken(
      refreshPayload.userId,
      refreshPayload.sessionId
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
}
```

### 3. Frontend JWT Security

#### Secure JWT Storage and Handling

```typescript
// lib/secure-storage.ts
export class SecureTokenStorage {
  private accessTokenKey = "auth_access_token";
  private refreshTokenKey = "auth_refresh_token";

  setTokens(accessToken: string, refreshToken: string): void {
    // Store access token in memory to avoid XSS
    this.setAccessToken(accessToken);

    // Store refresh token in httpOnly cookie or secure local storage
    this.setRefreshToken(refreshToken);
  }

  private setAccessToken(token: string): void {
    // Store in memory (not in localStorage to prevent XSS)
    (globalThis as any).__ACCESS_TOKEN__ = token;
  }

  private setRefreshToken(token: string): void {
    // For refresh tokens, consider using httpOnly cookies
    // This example uses localStorage with additional security measures
    localStorage.setItem(this.refreshTokenKey, token);
  }

  getAccessToken(): string | null {
    return (globalThis as any).__ACCESS_TOKEN__ || null;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  clearTokens(): void {
    delete (globalThis as any).__ACCESS_TOKEN__;
    localStorage.removeItem(this.refreshTokenKey);
  }

  // Check if access token is about to expire (within 5 minutes)
  isAccessTokenExpiringSoon(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      // Check if token expires in less than 5 minutes
      return exp - now < 5 * 60 * 1000;
    } catch (error) {
      return true; // If we can't parse, assume token is invalid
    }
  }
}

export const secureStorage = new SecureTokenStorage();
```

## Rate Limiting Implementation

### 1. FastAPI Rate Limiting with SlowAPI

#### Basic Rate Limiting Setup

```python
# rate_limiter.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request, HTTPException, status
from typing import Optional
import time

# Initialize the limiter with IP-based rate limiting
limiter = Limiter(key_func=get_remote_address)

def setup_rate_limiter(app: FastAPI):
    """
    Setup rate limiting for the FastAPI application
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Different rate limit tiers
LIMITS = {
    "anonymous": "100/hour",
    "basic": "500/hour",
    "premium": "2000/hour",
    "api_key": "10000/hour"
}

# Custom rate limit key function that considers user role
def get_user_rate_limit_key(request: Request) -> str:
    """
    Custom rate limit key that combines IP and user role
    """
    ip = get_remote_address(request)

    # Try to get user info from JWT
    auth_header = request.headers.get("authorization")
    user_id = "anonymous"
    user_role = "anonymous"

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            # Verify token to get user info
            from main import auth  # Import your auth instance
            decoded = auth.jwt.verify(token)
            user_id = decoded.get("userId", "anonymous")
            user_role = decoded.get("role", "basic")
        except:
            user_role = "anonymous"

    return f"{ip}:{user_role}"

# Alternative limiter that uses user role
user_based_limiter = Limiter(key_func=get_user_rate_limit_key)
```

#### Advanced Rate Limiting with User Context

```python
# advanced_rate_limiter.py
from slowapi import Limiter
from fastapi import Request
import redis
import os
from typing import Dict, Any

# Redis-based rate limiter for production
class RedisRateLimiter:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            decode_responses=True
        )

    def is_rate_limited(
        self,
        identifier: str,
        limit: int,
        window: int  # in seconds
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Check if a request is rate limited
        Returns (is_limited, rate_limit_info)
        """
        key = f"rate_limit:{identifier}"
        now = time.time()
        pipeline = self.redis_client.pipeline()

        # Remove expired entries
        pipeline.zremrangebyscore(key, 0, now - window)

        # Get current count
        pipeline.zcard(key)

        # Add current request
        pipeline.zadd(key, {str(now): now})

        # Set expiration
        pipeline.expire(key, window)

        results = pipeline.execute()
        current_count = results[1]

        # Calculate remaining requests
        remaining = max(0, limit - current_count)

        rate_limit_info = {
            "limit": limit,
            "remaining": remaining,
            "reset_time": int(now + window)
        }

        return current_count >= limit, rate_limit_info

redis_limiter = RedisRateLimiter()

def apply_rate_limit(
    request: Request,
    limit: int = 100,
    window: int = 3600  # 1 hour
):
    """
    Apply rate limiting to a request
    """
    # Get identifier based on IP and optional user info
    ip = request.client.host if request.client else "unknown"

    # Try to get user info from JWT
    auth_header = request.headers.get("authorization")
    user_id = "anonymous"

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            from main import auth
            decoded = auth.jwt.verify(token)
            user_id = decoded.get("userId", "anonymous")
        except:
            pass

    identifier = f"{ip}:{user_id}"

    is_limited, rate_info = redis_limiter.is_rate_limited(identifier, limit, window)

    # Add rate limit headers to response
    request.state.rate_limit_info = rate_info

    if is_limited:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "rate_limit_info": rate_info
            }
        )
```

### 2. Next.js Rate Limiting

#### Middleware-Based Rate Limiting

```typescript
// middleware/rate-limiter.ts
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "ioredis"; // If using Redis

// Simple in-memory rate limiter (use Redis in production)
class InMemoryRateLimiter {
  private limits = new Map<string, { count: number; resetTime: number }>();

  isRateLimited(
    identifier: string,
    limit: number,
    windowMs: number
  ): { isLimited: boolean; resetTime: number; remaining: number } {
    const now = Date.now();
    const record = this.limits.get(identifier);

    if (!record) {
      // First request from this identifier
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return {
        isLimited: false,
        resetTime: now + windowMs,
        remaining: limit - 1
      };
    }

    if (now > record.resetTime) {
      // Reset the counter after the time window
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return {
        isLimited: false,
        resetTime: now + windowMs,
        remaining: limit - 1
      };
    }

    if (record.count >= limit) {
      return {
        isLimited: true,
        resetTime: record.resetTime,
        remaining: 0
      };
    }

    // Increment the counter
    this.limits.set(identifier, {
      count: record.count + 1,
      resetTime: record.resetTime
    });

    return {
      isLimited: false,
      resetTime: record.resetTime,
      remaining: limit - record.count - 1
    };
  }
}

const rateLimiter = new InMemoryRateLimiter();

export function applyRateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): NextResponse | null {
  // Create identifier based on IP and optional user info
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // Try to get user ID from JWT in authorization header
  const authHeader = request.headers.get("authorization");
  let userId = "anonymous";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    // In a real implementation, you'd verify the JWT to get user ID
    // For this example, we'll just indicate it's an authenticated request
    userId = "authenticated";
  }

  const identifier = `${ip}:${userId}`;

  const result = rateLimiter.isRateLimited(identifier, limit, windowMs);

  // Add rate limit headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

  if (result.isLimited) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetTime.toString(),
      }
    });
  }

  return null; // Not rate limited
}
```

#### Next.js Middleware Implementation

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "./middleware/rate-limiter";

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    // Different rate limits for different API endpoints
    let limit = 100; // default
    let windowMs = 15 * 60 * 1000; // 15 minutes

    if (request.nextUrl.pathname.includes("/api/auth/")) {
      limit = 5; // Lower limit for auth endpoints
      windowMs = 5 * 60 * 1000; // 5 minutes
    } else if (request.nextUrl.pathname.includes("/api/upload")) {
      limit = 10; // Lower limit for upload endpoints
      windowMs = 60 * 60 * 1000; // 1 hour
    }

    const rateLimitResponse = applyRateLimit(request, limit, windowMs);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }

  // Apply authentication to protected routes
  if (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/api/protected")) {

    const authHeader = request.headers.get("authorization");
    const sessionCookie = request.cookies.get("better-auth.session_token");

    if (!authHeader && !sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If there's an authorization header, verify the JWT token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        // In a real implementation, you'd verify the JWT token
        // await auth.jwt.verify(token);
      } catch (error) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
```

### 3. Combined Rate Limiting Strategy

#### Service Layer Rate Limiting

```python
# services/rate_limit_service.py
from typing import Dict, Optional
import time
import redis
from enum import Enum

class RateLimitTier(Enum):
    ANONYMOUS = ("anonymous", 100, 3600)      # 100 requests per hour
    BASIC = ("basic", 500, 3600)              # 500 requests per hour
    PREMIUM = ("premium", 2000, 3600)         # 2000 requests per hour
    API_KEY = ("api_key", 10000, 3600)        # 10000 requests per hour

class RateLimitService:
    def __init__(self):
        self.redis_client = redis.Redis(
            host="localhost",  # Use environment variable in production
            port=6379,
            decode_responses=True
        )

    def check_rate_limit(
        self,
        identifier: str,
        tier: RateLimitTier = RateLimitTier.ANONYMOUS
    ) -> Dict[str, any]:
        """
        Check if request is within rate limits
        """
        tier_name, limit, window = tier.value

        # Use sliding window algorithm
        now = time.time()
        pipeline = self.redis_client.pipeline()

        # Remove expired entries
        pipeline.zremrangebyscore(f"rate_limit:{identifier}", 0, now - window)

        # Get current count
        pipeline.zcard(f"rate_limit:{identifier}")

        # Add current request
        pipeline.zadd(f"rate_limit:{identifier}", {str(now): now})

        # Set expiration
        pipeline.expire(f"rate_limit:{identifier}", window)

        results = pipeline.execute()
        current_count = results[1]

        remaining = max(0, limit - current_count)
        reset_time = int(now + window)

        is_limited = current_count >= limit

        return {
            "is_limited": is_limited,
            "limit": limit,
            "remaining": remaining,
            "reset_time": reset_time,
            "current_count": current_count
        }

    def get_user_tier(self, user_id: str) -> RateLimitTier:
        """
        Determine user's rate limit tier based on their account
        """
        # In a real implementation, you'd check the user's subscription level
        # This is a simplified example
        if user_id.startswith("premium_"):
            return RateLimitTier.PREMIUM
        elif user_id.startswith("basic_"):
            return RateLimitTier.BASIC
        else:
            return RateLimitTier.ANONYMOUS
```

#### API Endpoint with Combined Rate Limiting

```python
# routes/protected_routes.py
from fastapi import APIRouter, Depends, Request
from dependencies import CurrentUser, get_current_user
from services.rate_limit_service import RateLimitService, RateLimitTier
import os

router = APIRouter()
rate_limit_service = RateLimitService()

@router.get("/api/protected/data")
async def get_protected_data(
    request: Request,
    current_user = Depends(get_current_user)
):
    """
    Protected endpoint with user-based rate limiting
    """
    # Determine user's rate limit tier
    user_tier = rate_limit_service.get_user_tier(current_user.id)

    # Create identifier combining IP and user ID
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"{client_ip}:{current_user.id}"

    # Check rate limit
    rate_result = rate_limit_service.check_rate_limit(identifier, user_tier)

    if rate_result["is_limited"]:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "limit": rate_result["limit"],
                "reset_time": rate_result["reset_time"]
            }
        )

    # Add rate limit info to response headers
    request.state.rate_limit_info = rate_result

    # Return user's protected data
    return {
        "message": f"Hello {current_user.name}",
        "user_id": current_user.id,
        "data": "Protected user data",
        "rate_limit_info": {
            "limit": rate_result["limit"],
            "remaining": rate_result["remaining"],
            "reset_time": rate_result["reset_time"]
        }
    }

# For endpoints that don't require authentication
@router.get("/api/public/data")
async def get_public_data(request: Request):
    """
    Public endpoint with IP-based rate limiting
    """
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"ip:{client_ip}"

    # Use anonymous tier for unauthenticated requests
    rate_result = rate_limit_service.check_rate_limit(
        identifier,
        RateLimitTier.ANONYMOUS
    )

    if rate_result["is_limited"]:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded"
        )

    return {
        "message": "Public data",
        "rate_limit_info": {
            "limit": rate_result["limit"],
            "remaining": rate_result["remaining"],
            "reset_time": rate_result["reset_time"]
        }
    }
```

## Security Headers and Additional Measures

### 1. Security Headers for JWT and Rate Limiting

```typescript
// middleware/security-headers.ts
export function addSecurityHeaders(response: Response): Response {
  // Add security headers to prevent common attacks
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}
```

### 2. Monitoring and Alerting

```python
# monitoring/rate_limit_monitor.py
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class RateLimitMonitor:
    @staticmethod
    def log_rate_limit_event(
        identifier: str,
        rate_limit_info: Dict[str, Any],
        endpoint: str,
        user_agent: str = None
    ):
        """
        Log rate limit events for monitoring and alerting
        """
        logger.warning(
            "Rate limit event",
            extra={
                "identifier": identifier,
                "endpoint": endpoint,
                "rate_limit_info": rate_limit_info,
                "user_agent": user_agent,
                "timestamp": time.time()
            }
        )

    @staticmethod
    def should_alert_on_rate_limit(rate_limit_info: Dict[str, Any]) -> bool:
        """
        Determine if an alert should be sent based on rate limit patterns
        """
        # Alert if someone is hitting the rate limit repeatedly
        return rate_limit_info["current_count"] > rate_limit_info["limit"] * 2
```

These patterns provide comprehensive JWT security and rate limiting implementations that work together to create a secure, scalable authentication and authorization system between your Next.js frontend and FastAPI backend.