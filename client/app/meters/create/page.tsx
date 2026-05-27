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
          : 'Failed to register meter. Please verify data and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 pb-16 selection:bg-orange-500 selection:text-white">
      
      {/* Header navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-[#ff5a00] rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20 hover:opacity-90 transition-opacity">
            <span className="text-white font-black text-lg">G</span>
          </Link>
          <span className="text-xl font-bold tracking-tight text-white">
            GPS <span className="text-orange-500">Monitor</span>
          </span>
        </div>

        <Link
          href="/meters"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ← Cancel and Return
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 mt-12 relative overflow-hidden">
        
        {/* Glow BGs */}
        <div className="absolute top-10 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="mb-8 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Register New Meter</h1>
          <p className="text-sm text-slate-400">Configure a smart device instance onto the electricity power grid</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage message={error} />}

            <div>
              <label
                htmlFor="meter_id"
                className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2"
              >
                Meter ID / Serial Number <span className="text-orange-500 font-black">*</span>
              </label>
              <input
                type="text"
                id="meter_id"
                name="meter_id"
                value={formData.meter_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl focus:outline-none focus:border-orange-500 text-slate-100 placeholder-slate-600 transition-colors text-sm font-semibold"
                placeholder="e.g., MTR-o2"
              />
              <p className="mt-1.5 text-[10px] text-slate-500 font-medium">
                Must match the device configuration ID uploaded from the ESP32.
              </p>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2"
              >
                Display Label Name <span className="text-orange-500 font-black">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl focus:outline-none focus:border-orange-500 text-slate-100 placeholder-slate-600 transition-colors text-sm font-semibold"
                placeholder="e.g., Residential Complex A"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="default_latitude"
                  className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2"
                >
                  Reference Latitude <span className="text-orange-500 font-black">*</span>
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
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl focus:outline-none focus:border-orange-500 text-slate-100 placeholder-slate-600 transition-colors text-sm font-mono font-semibold"
                  placeholder="e.g., 0.337033"
                />
                <p className="mt-1 text-[10px] text-slate-500 font-medium">Range: -90.0 to 90.0</p>
              </div>

              <div>
                <label
                  htmlFor="default_longitude"
                  className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2"
                >
                  Reference Longitude <span className="text-orange-500 font-black">*</span>
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
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl focus:outline-none focus:border-orange-500 text-slate-100 placeholder-slate-600 transition-colors text-sm font-mono font-semibold"
                  placeholder="e.g., 32.577518"
                />
                <p className="mt-1 text-[10px] text-slate-500 font-medium">Range: -180.0 to 180.0</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="threshold_distance"
                  className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2"
                >
                  Security Fence Radius (meters) <span className="text-orange-500 font-black">*</span>
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
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl focus:outline-none focus:border-orange-500 text-slate-100 placeholder-slate-600 transition-colors text-sm font-semibold"
                  placeholder="50"
                />
                <p className="mt-1.5 text-[10px] text-slate-500 font-medium">
                  Trigger automatic shut-off if device moves beyond this boundary.
                </p>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2"
                >
                  Initial Relay State <span className="text-orange-500 font-black">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-950/85 border border-slate-850 rounded-xl focus:outline-none focus:border-orange-500 text-slate-100 transition-colors text-sm font-semibold"
                >
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                </select>
                <p className="mt-1.5 text-[10px] text-slate-500 font-medium">
                  Default switch state of the meter output relay.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-800/80">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:from-slate-800 disabled:to-slate-800 text-white rounded-xl disabled:text-slate-500 disabled:cursor-not-allowed transition-all font-semibold text-sm shadow-lg shadow-orange-950/30"
              >
                {loading ? 'Registering Device...' : 'Register Device'}
              </button>
              <Link
                href="/meters"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all font-semibold text-sm border border-slate-700/50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Informational Widget */}
        <div className="mt-8 bg-blue-950/30 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-sm font-bold text-blue-400 mb-2.5 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            GPS Boundary Protection Info
          </h3>
          <ul className="text-xs text-blue-300 space-y-1.5 leading-relaxed">
            <li>• Obtain precise base coordinates directly from high-resolution map indicators.</li>
            <li>• Reference Coordinates must represent the permanent static physical installation point.</li>
            <li>• Automated security checks will cut off device power if the system detects an unauthorized radius breach.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
