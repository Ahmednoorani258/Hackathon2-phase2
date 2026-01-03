'use client';

import { useState, useCallback } from 'react';

interface ApiError {
  message: string;
  status?: number;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (apiCall: () => Promise<T>) => Promise<T | null>;
  clearError: () => void;
}

function useApi<T>(): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    // Don't set data to null - keep the previous data for smoother UX

    try {
      const result = await apiCall();
      setData(result);
      return result;  // Return the result immediately
    } catch (err: any) {
      setError({
        message: err.message || 'An unexpected error occurred',
        status: err.status || 500,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { data, loading, error, execute, clearError };
}

export default useApi;