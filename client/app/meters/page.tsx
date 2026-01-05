'use client';

import Link from 'next/link';
import { useMeters } from '@/hooks/useMeters';
import MeterCard from '@/components/meters/MeterCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function MetersPage() {
  const { meters, loading, error, refresh } = useMeters(30000); // Refresh every 30 seconds

  const onMeters = meters.filter((m) => m.status === 'ON');
  const offMeters = meters.filter((m) => m.status === 'OFF');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Meters</h1>
            <p className="text-gray-600">
              Total: {meters.length} | ON: {onMeters.length} | OFF: {offMeters.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/meters/create"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Create Meter
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error.message} onRetry={refresh} />}

        {!loading && !error && (
          <>
            {meters.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No meters found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meters.map((meter) => (
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

