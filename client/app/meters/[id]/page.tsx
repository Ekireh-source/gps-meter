'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMeter, getLocationHistory, getStatusHistory } from '@/lib/api';
import { useMeterStatus } from '@/hooks/useMeterStatus';
import StatusIndicator from '@/components/ui/StatusIndicator';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import type { Meter, LocationHistory, MeterStatusLog } from '@/lib/types';

export default function MeterDetailPage() {
  const params = useParams();
  const meterId = params.id as string;
  
  const [meter, setMeter] = useState<Meter | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationHistory[]>([]);
  const [statusHistory, setStatusHistory] = useState<MeterStatusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { status: realTimeStatus } = useMeterStatus(meterId, 5000);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [meterData, locationData, statusData] = await Promise.all([
          getMeter(meterId),
          getLocationHistory(meterId),
          getStatusHistory(meterId),
        ]);
        setMeter(meterData);
        setLocationHistory(locationData);
        setStatusHistory(statusData);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [meterId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !meter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage
            message={error?.message || 'Meter not found'}
            onRetry={() => window.location.reload()}
          />
          <Link
            href="/meters"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Meters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/meters"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Meters
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{meter.name}</h1>
              <p className="text-gray-600">ID: {meter.meter_id}</p>
            </div>
            <StatusIndicator status={realTimeStatus?.status || meter.status} size="lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Status Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${
                    meter.status === 'ON' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {meter.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Within Threshold:</span>
                  <span className={`font-semibold ${
                    meter.within_threshold ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {meter.within_threshold ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Threshold Distance:</span>
                  <span className="font-semibold">{meter.threshold_distance}m</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4">Location Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Default Location:</span>
                  <p className="font-mono text-sm">
                    {meter.default_latitude}, {meter.default_longitude}
                  </p>
                </div>
                {meter.current_latitude && meter.current_longitude && (
                  <div>
                    <span className="text-gray-600">Current Location:</span>
                    <p className="font-mono text-sm">
                      {meter.current_latitude}, {meter.current_longitude}
                    </p>
                  </div>
                )}
                {meter.last_location_update && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="text-sm">
                      {new Date(meter.last_location_update).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Location History</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {locationHistory.length === 0 ? (
                <p className="text-gray-600 text-sm">No location history available</p>
              ) : (
                locationHistory.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="border-b pb-2 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="font-mono text-xs">
                        {entry.latitude.toFixed(6)}, {entry.longitude.toFixed(6)}
                      </span>
                      <span className={`text-xs ${
                        entry.is_within_threshold ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.distance_from_default.toFixed(2)}m
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Status Change History</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {statusHistory.length === 0 ? (
                <p className="text-gray-600 text-sm">No status history available</p>
              ) : (
                statusHistory.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className="border-b pb-2 text-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-semibold ${
                        log.status === 'ON' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {log.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Reason: {log.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

