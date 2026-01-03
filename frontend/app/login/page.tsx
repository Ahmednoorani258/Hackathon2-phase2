'use client';

import { useState, useEffect } from 'react';
import { signIn, signUp, getSession, type Session } from '@/lib/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const currentSession = await getSession();
      setSession(currentSession);
      if (currentSession) {
        router.push('/');
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (password.length === 0) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign in with email and password
        const result = await signIn(email, password);

        if (!result) {
          // This block might not be reached if signIn throws, but good as a fallback
          throw new Error('Sign in failed. Please check your credentials.');
        } else {
          // Session created, redirect to home
          router.push('/');
        }
      } else {
        // Sign up
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }

        const result = await signUp(email, password, name || email.split('@')[0]);

        if (!result) {
          throw new Error('Sign up failed. Please try again.');
        } else {
          // Auto-login after registration
          router.push('/');
        }
      }
    } catch (err: any) {
      // Extract error message
      let message = 'An unexpected error occurred';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      } else if (err.detail) {
        message = err.detail;
      }

      setError(message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-300/20 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-300/20 blur-3xl"></div>
      </div>

      <div className="max-w-md w-full glass-panel p-8 sm:p-10 transform transition-all hover:scale-[1.01] duration-500">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gradient mb-2">
            {isLogin ? 'Welcome Back' : 'Join the Voyage'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to access your tasks' : 'Start your productivity journey'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-100 text-error-600 rounded-xl text-sm font-medium animate-pulse">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2 ml-1">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-luxury"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 ml-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-luxury"
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-luxury"
                placeholder="Enter your full name"
              />
            </div>
          )}

          {!isLogin && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-luxury"
                placeholder="Confirm your password"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`btn-luxury w-full flex justify-center items-center ${loading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
              ) : null}
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center space-y-4">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            {isLogin
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </button>

          <div className="block">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}