'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createMeter } from '@/lib/api';
import ErrorMessage from '@/components/ui/ErrorMessage';
import type { Meter } from '@/lib/types';

interface MeterFormData {
  meter_id: string;
  name: string;
  default_latitude: string;
  default_longitude: string;
  threshold_distance: string;
  status: 'ON' | 'OFF';
}

export default function CreateMeterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MeterFormData>({
    meter_id: '',
    name: '',
    default_latitude: '',
    default_longitude: '',
    threshold_distance: '50',
    status: 'ON',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.meter_id.trim()) {
      return 'Meter ID is required';
    }
    if (!formData.name.trim()) {
      return 'Meter name is required';
    }
    const lat = parseFloat(formData.default_latitude);
    const lng = parseFloat(formData.default_longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return 'Latitude must be a number between -90 and 90';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return 'Longitude must be a number between -180 and 180';
    }
    const threshold = parseFloat(formData.threshold_distance);
    if (isNaN(threshold) || threshold <= 0) {
      return 'Threshold distance must be a positive number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const meterData: Partial<Meter> = {
        meter_id: formData.meter_id.trim(),
        name: formData.name.trim(),
        default_latitude: parseFloat(formData.default_latitude),
        default_longitude: parseFloat(formData.default_longitude),
        threshold_distance: parseFloat(formData.threshold_distance),
        status: formData.status,
        is_active: true,
      };

      await createMeter(meterData);
      router.push('/meters');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create meter. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/meters"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Meters
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Meter
          </h1>
          <p className="text-gray-600">
            Register a new electricity meter with GPS tracking
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage message={error} />}

            <div>
              <label
                htmlFor="meter_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Meter ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="meter_id"
                name="meter_id"
                value={formData.meter_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., MTR-001"
              />
              <p className="mt-1 text-xs text-gray-500">
                Unique identifier for the meter
              </p>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Meter Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Main Building Meter"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="default_latitude"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Default Latitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="default_latitude"
                  name="default_latitude"
                  value={formData.default_latitude}
                  onChange={handleChange}
                  required
                  step="any"
                  min="-90"
                  max="90"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 40.7128"
                />
                <p className="mt-1 text-xs text-gray-500">Range: -90 to 90</p>
              </div>

              <div>
                <label
                  htmlFor="default_longitude"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Default Longitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="default_longitude"
                  name="default_longitude"
                  value={formData.default_longitude}
                  onChange={handleChange}
                  required
                  step="any"
                  min="-180"
                  max="180"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., -74.0060"
                />
                <p className="mt-1 text-xs text-gray-500">Range: -180 to 180</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="threshold_distance"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Threshold Distance (meters) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="threshold_distance"
                  name="threshold_distance"
                  value={formData.threshold_distance}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum allowed distance from default location
                </p>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Initial Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Initial meter status
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Creating...' : 'Create Meter'}
              </button>
              <Link
                href="/meters"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            📍 Location Tips
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use GPS coordinates from Google Maps or similar services</li>
            <li>• Default location is where the meter should remain</li>
            <li>• If meter moves beyond threshold distance, it will automatically turn off</li>
            <li>• Threshold distance is measured in meters (default: 50m)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

