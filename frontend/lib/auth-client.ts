/**
 * Client-side authentication functions
 * 
 * These functions communicate with the backend auth endpoints
 * via the frontend API proxy at /api/auth/*
 * 
 * Flow:
 * 1. Frontend calls /api/auth/sign-up or /api/auth/sign-in
 * 2. Proxy forwards to backend http://localhost:8000/api/auth/*
 * 3. Backend generates JWT token and returns it
 * 4. Frontend stores token for subsequent API calls
 */

'use client';

import { useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Session {
  user: User;
  token: string;
}

export interface UseSessionReturn {
  data: Session | null;
  isPending: boolean;
  error: string | null;
}

/**
 * Sign in with email and password
 */
/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<Session | null> {
  const response = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ detail: 'Sign in failed' }));
    throw new Error(data.detail || 'Sign in failed');
  }

  const data = await response.json();
  // Store token in localStorage
  if (data.token && typeof window !== 'undefined') {
    localStorage.setItem('auth_token', data.token);
  }
  return data;
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  name: string
): Promise<Session | null> {
  const response = await fetch('/api/auth/sign-up', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ detail: 'Sign up failed' }));
    throw new Error(data.detail || 'Sign up failed');
  }

  const data = await response.json();
  // Store token in localStorage
  if (data.token && typeof window !== 'undefined') {
    localStorage.setItem('auth_token', data.token);
  }
  return data;
}

/**
 * Sign out - clears the session cookie and token
 */
export async function signOut(): Promise<void> {
  try {
    // Call the backend sign-out endpoint
    const response = await fetch('/api/auth/sign-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Sign out failed:', response.status);
    }
  } catch (error) {
    console.error('Sign out error:', error);
  } finally {
    // Always clear token from localStorage, even if the backend call fails
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }
}

/**
 * Get current session by fetching from the backend
 */
export async function getSession(): Promise<Session | null> {
  try {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/auth/session', {
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch {
    return null;
  }
}

/**
 * Get JWT token from current session
 */
export async function getToken(): Promise<string | null> {
  const session = await getSession();
  return session?.token || null;
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
    const session = await getSession();
    return session?.user || null;
  }

  /**
   * React hook to get current session with automatic polling
   * 
   * Usage:
   * const { data: session, isPending, error } = useSession();
   */
  export function useSession(): UseSessionReturn {
    const [data, setData] = useState<Session | null>(null);
    const [isPending, setIsPending] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchSession = async () => {
        try {
          setIsPending(true);
        const session = await getSession();
        setData(session);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch session');
        setData(null);
      } finally {
        setIsPending(false);
      }
    };

    fetchSession();

    // Optionally poll for session changes every 30 seconds
    const interval = setInterval(fetchSession, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, isPending, error };
}