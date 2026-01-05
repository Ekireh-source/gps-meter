'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMeters } from '@/lib/api';
import type { Meter } from '@/lib/types';

export function useMeters(refreshInterval?: number) {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMeters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMeters();
      setMeters(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeters();

    if (refreshInterval) {
      const intervalId = setInterval(fetchMeters, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchMeters, refreshInterval]);

  return { meters, loading, error, refresh: fetchMeters };
}

