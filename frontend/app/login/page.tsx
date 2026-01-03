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

    try {
      if (isLogin) {
        // Sign in with email and password
        const result = await signIn(email, password);
        
        if (!result) {
          setError('Sign in failed. Please try again.');
        } else {
          // Session created, redirect to home
          router.push('/');
        }
      } else {
        // Sign up
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }

        const result = await signUp(email, password, name || email.split('@')[0]);
        
        if (!result) {
          setError('Sign up failed. Please try again.');
        } else {
          // Auto-login after registration
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Get started with your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-100 text-error-700 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="input-field w-full"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="input-field w-full"
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="Enter your full name"
              />
            </div>
          )}

          {!isLogin && (
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="input-field w-full"
                placeholder="Confirm your password"
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-700 font-medium">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}