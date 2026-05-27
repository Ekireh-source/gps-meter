'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMapData } from '@/lib/api';
import type { MapMeter } from '@/lib/types';

export function useMapData(refreshInterval?: number) {
  const [meters, setMeters] = useState<MapMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMapData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      const data = await getMapData();
      setMeters(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchMapData();

    if (refreshInterval) {
      const intervalId = setInterval(() => fetchMapData(true), refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [fetchMapData, refreshInterval]);

  return { 
    meters, 
    loading, 
    error, 
    refresh: () => fetchMapData(false) 
  };
}

