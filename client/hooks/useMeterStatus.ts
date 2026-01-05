'use client';

import { useState, useEffect } from 'react';
import { getMeterStatus } from '@/lib/api';
import type { MeterStatus } from '@/lib/types';

export function useMeterStatus(meterId: string, interval = 5000) {
  const [status, setStatus] = useState<MeterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getMeterStatus(meterId);
        setStatus(data);
        setLoading(false);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, interval);

    return () => clearInterval(intervalId);
  }, [meterId, interval]);

  return { status, loading, error };
}

