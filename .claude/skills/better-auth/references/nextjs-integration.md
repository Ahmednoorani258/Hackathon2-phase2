# Better Auth Next.js 16 Integration Reference

## App Router Setup

### API Routes

```typescript
// app/api/auth/[...betterAuth]/route.ts
import { auth } from "@/lib/auth";

export const {
  GET,
  POST
} = auth;
```

### Environment Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-auth"],
  },
};

module.exports = nextConfig;
```

## Server Component Patterns

### Session Validation

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
    </div>
  );
}
```

### Data Fetching with Authentication

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getUserData() {
  "use server";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Fetch user-specific data
  return { userId: session.user.id, email: session.user.email };
}

export default async function ProfilePage() {
  const userData = await getUserData();

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {userData.email}</p>
    </div>
  );
}
```

## Client Component Integration

### Auth Provider

```typescript
// providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

type AuthContextType = {
  user: any;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check current session
    authClient.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authClient.signIn.email({
      email,
      password,
    });

    if (response.data?.session) {
      setUser(response.data.session.user);
    }
  };

  const signOut = async () => {
    await authClient.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Middleware Configuration

### Advanced Middleware with Full Session Validation

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: {
      cookie: request.headers.get("cookie") || "",
    }
  });

  // Protect specific routes
  if (request.nextUrl.pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Redirect authenticated users from auth pages
  if (
    (request.nextUrl.pathname.startsWith("/sign-in") ||
     request.nextUrl.pathname.startsWith("/sign-up")) &&
    session
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in",
    "/sign-up",
    "/api/:path*",
  ],
};
```

## Error Handling Patterns

### API Error Response

```typescript
// lib/error-handler.ts
export function handleAuthError(error: any) {
  if (error.status === 401) {
    return { error: "Unauthorized", status: 401 };
  }
  if (error.status === 403) {
    return { error: "Forbidden", status: 403 };
  }
  return { error: "Authentication error", status: 500 };
}
```

## Deployment Considerations

### Production Environment Variables

```env
# Required for production
BETTER_AUTH_URL=https://yourdomain.com
BETTER_AUTH_SECRET=your-production-secret
DATABASE_URL=your-production-database-url

# Optional but recommended
BETTER_AUTH_TRUST_HOST=true
BETTER_AUTH_BASE_PATH=/api/auth
```

### Database Configuration

```typescript
// For production deployments
import { betterAuth } from "better-auth";
import { postgresAdapter } from "better-auth/adapters/postgres";

export const auth = betterAuth({
  database: postgresAdapter(process.env.DATABASE_URL!, {
    // Additional PostgreSQL-specific options
  }),
  // ... other configuration
});
```