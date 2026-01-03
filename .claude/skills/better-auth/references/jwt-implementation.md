# Better Auth JWT Token Implementation Reference

## JWT Configuration Options

### Basic JWT Setup

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      algorithm: "HS256", // Supported: HS256, HS384, HS512
      expiresIn: "7d",    // Token expiration (7 days)
      issuer: "https://yourdomain.com", // Token issuer
      audience: ["https://api.yourdomain.com"], // Token audience
      secret: process.env.JWT_SECRET, // Optional: custom secret for JWT signing
    }),
  ],
});
```

### Advanced JWT Configuration

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      algorithm: "RS256", // Use RS256 for asymmetric signing
      expiresIn: "24h",   // Shorter expiration for access tokens
      issuer: "https://yourdomain.com",
      audience: ["https://api.yourdomain.com", "https://app.yourdomain.com"],
      privateKey: process.env.JWT_PRIVATE_KEY, // For RS256
      publicKey: process.env.JWT_PUBLIC_KEY,   // For RS256
      // Custom claims
      includeUser: true, // Include user data in JWT payload
      customClaims: async (user) => ({
        role: user.role || "user",
        permissions: user.permissions || [],
        customField: user.customField,
      }),
    }),
  ],
});
```

## JWT Token Generation and Usage

### Server-Side Token Generation

```typescript
import { auth } from "@/lib/auth";

// Generate JWT token for a specific user
export async function generateUserToken(userId: string) {
  const token = await auth.jwt.sign({
    userId,
    // Additional claims
    scope: ["read", "write"],
    iat: Math.floor(Date.now() / 1000),
  });

  return token;
}

// Generate token with user data
export async function generateTokenWithUserData(userId: string) {
  const user = await auth.getUser({
    userId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const token = await auth.jwt.sign({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
  });

  return token;
}
```

### Client-Side Token Operations

```typescript
import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  plugins: [jwtClient()],
});

// Generate JWT token
async function generateToken() {
  const { data, error } = await authClient.jwt.generate();

  if (error) {
    console.error("JWT generation error:", error);
    return null;
  }

  return data?.token;
}

// Decode JWT token
async function decodeToken(token: string) {
  const { data, error } = await authClient.jwt.decode({
    token,
  });

  if (error) {
    console.error("JWT decode error:", error);
    return null;
  }

  return data;
}
```

## JWT Token Validation

### Server-Side Token Validation

```typescript
import { auth } from "@/lib/auth";

// Validate JWT token
export async function validateToken(token: string) {
  try {
    const decoded = await auth.jwt.verify(token);
    return decoded;
  } catch (error) {
    console.error("JWT validation error:", error);
    return null;
  }
}

// Middleware for API routes
export async function requireValidToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring(7);
  const decoded = await validateToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Add user info to request
  (req as any).user = decoded;
  return decoded;
}
```

## Refresh Token Implementation

### JWT with Refresh Token Pattern

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    jwt({
      algorithm: "HS256",
      // Access token expires in 15 minutes
      expiresIn: "15m",
      issuer: "https://yourdomain.com",
      audience: ["https://api.yourdomain.com"],
    }),
  ],
  session: {
    expires: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
  },
});

// Token refresh endpoint
export async function refreshAccessToken(refreshToken: string) {
  // Verify refresh token (using Better Auth's session system)
  const session = await auth.getSession({
    token: refreshToken,
  });

  if (!session) {
    throw new Error("Invalid refresh token");
  }

  // Generate new access token
  const newAccessToken = await auth.jwt.sign({
    userId: session.userId,
    sessionId: session.id,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: session.token, // Use existing refresh token or generate new one
  };
}
```

## JWT in Next.js API Routes

### Protected API Route with JWT

```typescript
// app/api/protected/route.ts
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Extract token from Authorization header
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.substring(7);
  let decoded;

  try {
    decoded = await auth.jwt.verify(token);
  } catch (error) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  // Token is valid, return protected data
  return Response.json({
    message: "Access granted",
    userId: decoded.userId,
    timestamp: new Date().toISOString(),
  });
}
```

### JWT with Custom Claims

```typescript
// Custom claims middleware
export async function withJwtAuth(handler: any) {
  return async (request: NextRequest, ctx: any) => {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;

    try {
      decoded = await auth.jwt.verify(token);
    } catch (error) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    // Add decoded token to request context
    (request as any).jwtPayload = decoded;

    return handler(request, ctx);
  };
}

// Usage in API route
export const GET = withJwtAuth(async (request: NextRequest) => {
  const jwtPayload = (request as any).jwtPayload;

  return Response.json({
    message: "Protected data",
    user: jwtPayload,
  });
});
```

## JWT Security Best Practices

### Token Storage and Transmission

```typescript
// Secure token storage in HTTP-only cookies
import { setCookie } from "cookies-next";

export function storeSecureToken(token: string, res: any) {
  setCookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  });
}

// Retrieve token from secure cookie
export function getSecureToken(req: any) {
  return req.cookies.access_token;
}
```

### Token Rotation

```typescript
// Token rotation implementation
export async function rotateToken(currentToken: string) {
  try {
    const decoded = await auth.jwt.verify(currentToken);

    // Generate new token with same claims
    const newToken = await auth.jwt.sign({
      ...decoded,
      iat: Math.floor(Date.now() / 1000),
      jti: generateRandomId(), // JWT ID for tracking
    });

    return newToken;
  } catch (error) {
    throw new Error("Token rotation failed");
  }
}

function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
```

## Testing JWT Implementation

### Unit Tests for JWT

```typescript
// __tests__/jwt.test.ts
import { auth } from "@/lib/auth";

describe("JWT Implementation", () => {
  test("should generate valid JWT token", async () => {
    const token = await auth.jwt.sign({ userId: "test-user" });
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT has 3 parts
  });

  test("should verify valid JWT token", async () => {
    const payload = { userId: "test-user", role: "admin" };
    const token = await auth.jwt.sign(payload);
    const decoded = await auth.jwt.verify(token);

    expect(decoded.userId).toBe("test-user");
    expect(decoded.role).toBe("admin");
  });

  test("should reject invalid JWT token", async () => {
    await expect(
      auth.jwt.verify("invalid.token.format")
    ).rejects.toThrow();
  });
});
```