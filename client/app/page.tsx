'use client';

import Link from 'next/link';
import { useMeters } from '@/hooks/useMeters';
import MeterCard from '@/components/meters/MeterCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function HomePage() {
  const { meters, loading, error, refresh } = useMeters(30000); // Refresh every 30 seconds

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GPS Meter Monitoring System
          </h1>
          <p className="text-gray-600">
            Monitor electricity meters and track their locations in real-time
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Link
            href="/meters/create"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Create Meter
          </Link>
          <Link
            href="/meters"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Meters
          </Link>
          <Link
            href="/map"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Map
          </Link>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error.message} onRetry={refresh} />}

        {!loading && !error && (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Meters ({meters.length})
              </h2>
            </div>
            {meters.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No meters found. Create one to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meters.slice(0, 6).map((meter) => (
                  <MeterCard key={meter.id} meter={meter} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
