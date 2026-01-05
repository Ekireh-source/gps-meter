'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMapData } from '@/hooks/useMapData';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

// Dynamically import MeterMap to avoid SSR issues
const MeterMap = dynamic(() => import('@/components/map/MeterMap'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

export default function MapPage() {
  const { meters, loading, error, refresh } = useMapData(10000); // Refresh every 10 seconds

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Meter Map View</h1>
          <p className="text-sm text-gray-600">
            {meters.length} meters displayed
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Dashboard
          </Link>
          <Link
            href="/meters"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Meters List
          </Link>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading && meters.length === 0 && <LoadingSpinner />}
        {error && <ErrorMessage message={error.message} onRetry={refresh} />}
        {!loading && !error && meters.length > 0 && (
          <MeterMap meters={meters} showThreshold={true} />
        )}
        {!loading && !error && meters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <p className="text-gray-600 mb-4">No meters to display on map</p>
              <Link
                href="/meters"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Meters
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

