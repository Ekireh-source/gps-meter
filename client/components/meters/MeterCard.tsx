'use client';

import Link from 'next/link';
import StatusIndicator from '../ui/StatusIndicator';
import type { Meter } from '@/lib/types';

interface MeterCardProps {
  meter: Meter;
}

export default function MeterCard({ meter }: MeterCardProps) {
  const distance = meter.current_latitude && meter.current_longitude
    ? 'N/A' // Distance calculation would be done on backend
    : 'N/A';

  return (
    <Link href={`/meters/${meter.meter_id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{meter.name}</h3>
            <p className="text-sm text-gray-500">ID: {meter.meter_id}</p>
          </div>
          <StatusIndicator status={meter.status} size="md" />
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-medium ${
              meter.status === 'ON' ? 'text-green-600' : 'text-red-600'
            }`}>
              {meter.status}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Within Threshold:</span>
            <span className={`font-medium ${
              meter.within_threshold ? 'text-green-600' : 'text-red-600'
            }`}>
              {meter.within_threshold ? 'Yes' : 'No'}
            </span>
          </div>
          
          {meter.last_location_update && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Update:</span>
              <span className="text-gray-900">
                {new Date(meter.last_location_update).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

