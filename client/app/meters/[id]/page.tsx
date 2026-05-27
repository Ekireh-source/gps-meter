'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMeter, getLocationHistory, getStatusHistory } from '@/lib/api';
import { useMeterStatus } from '@/hooks/useMeterStatus';
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

  useEffect(() => {
    fetchData();
  }, [meterId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !meter) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <ErrorMessage
            message={error?.message || 'Meter not found'}
            onRetry={() => fetchData()}
          />
          <Link
            href="/meters"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all text-sm font-medium border border-slate-700/50"
          >
            ← Back to Meters
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = realTimeStatus?.status || meter.status;
  const isOnline = meter.connection_status === 'ONLINE';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 pb-12 selection:bg-orange-500 selection:text-white">
      {/* Navbar / Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/meters" className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Meters
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 text-sm font-semibold truncate max-w-[200px]">{meter.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchData()} 
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800 hover:border-slate-700"
            title="Refresh Data"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
            </svg>
          </button>
          <Link
            href="/"
            className="px-4 py-1.5 bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-750 rounded-lg transition-all text-xs font-semibold"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        {/* Device Alert Banners */}
        {meter.tamper && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-200 shadow-lg shadow-red-950/10">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm">
              <span className="font-bold">Tamper Detected!</span> The enclosure security switch has been triggered on this device.
            </div>
          </div>
        )}

        {/* Hero Header Section */}
        <div className="relative overflow-hidden bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mb-8 shadow-2xl backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{meter.name}</h1>
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border ${
                  isOnline 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-slate-800 text-slate-400 border-slate-700/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {meter.connection_status}
                </div>
              </div>
              <p className="text-slate-400 text-sm font-mono">Meter Reference: <span className="text-orange-500 font-bold">{meter.meter_id}</span></p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500">Telemetry Last Seen</p>
                <p className="text-sm text-slate-300 font-semibold">
                  {meter.last_seen ? new Date(meter.last_seen).toLocaleString() : 'Never'}
                </p>
              </div>
              
              <div className={`px-5 py-3 rounded-2xl flex flex-col items-center justify-center border shadow-xl ${
                currentStatus === 'ON'
                  ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-950/20 text-red-400 border-red-500/20'
              }`}>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Relay Switch</span>
                <span className="text-xl font-black">{currentStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Telemetry Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: AC Voltage & Current */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Power Grid Input</span>
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight text-white">
                {meter.voltage !== null ? `${Number(meter.voltage).toFixed(1)} V` : '--'}
              </h3>
              <p className="text-xs text-slate-400 flex items-center justify-between">
                <span>Current RMS:</span>
                <span className="font-semibold text-slate-200">
                  {meter.current !== null ? `${Number(meter.current).toFixed(2)} A` : '--'}
                </span>
              </p>
            </div>
          </div>

          {/* Card 2: Active Power & Energy */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Load Consumption</span>
              <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight text-white">
                {meter.power !== null ? `${Number(meter.power).toFixed(3)} kW` : '--'}
              </h3>
              <p className="text-xs text-slate-400 flex items-center justify-between">
                <span>Total Accumulated:</span>
                <span className="font-semibold text-slate-200">
                  {meter.energy !== null ? `${Number(meter.energy).toFixed(2)} kWh` : '--'}
                </span>
              </p>
            </div>
          </div>

          {/* Card 3: Available Balance & Progress */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Prepaid Utility</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-white">
                {meter.available_units !== null ? `${Number(meter.available_units).toFixed(1)} Units` : '--'}
              </h3>
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Current Balance:</span>
                  <span className="font-bold text-slate-200">${meter.current_balance !== null ? Number(meter.current_balance).toFixed(2) : '0.00'}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      Number(meter.available_units) > 100 
                        ? 'bg-emerald-500' 
                        : Number(meter.available_units) > 20 
                          ? 'bg-amber-500' 
                          : 'bg-red-500'
                    }`} 
                    style={{ width: `${Math.min(100, (Number(meter.available_units) / 1000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Safety & Geo-Fence status */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Geo-Fence Guard</span>
              <div className={`p-2 rounded-lg group-hover:scale-105 transition-transform ${
                meter.within_threshold 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-red-500/10 text-red-400'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 12l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className={`text-2xl font-bold tracking-tight ${meter.within_threshold ? 'text-emerald-400' : 'text-red-400'}`}>
                {meter.within_threshold ? 'Secured' : 'Breached'}
              </h3>
              <p className="text-xs text-slate-400 flex items-center justify-between">
                <span>Threshold Radius:</span>
                <span className="font-semibold text-slate-200">{Number(meter.threshold_distance).toFixed(0)} meters</span>
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Layout panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Geolocation Details Panel */}
          <div className="lg:col-span-1 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <h2 className="text-lg font-bold tracking-tight text-white mb-6 pb-2 border-b border-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location Diagnostics
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-1">Registered Coordinates</label>
                <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 font-mono text-xs text-slate-300 flex justify-between items-center">
                  <span>{Number(meter.default_latitude).toFixed(6)}, {Number(meter.default_longitude).toFixed(6)}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wide text-blue-400/90 bg-blue-500/10 px-2 py-0.5 border border-blue-500/10 rounded-md">Reference Base</span>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-semibold text-slate-500 block mb-1">Last Reported GPS Position</label>
                {meter.current_latitude && meter.current_longitude ? (
                  <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3 font-mono text-xs text-slate-300 flex justify-between items-center">
                    <span>{Number(meter.current_latitude).toFixed(6)}, {Number(meter.current_longitude).toFixed(6)}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 border rounded-md ${
                      meter.within_threshold 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' 
                        : 'text-red-400 bg-red-500/10 border-red-500/10 animate-pulse'
                    }`}>
                      Live Position
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/40 border border-dashed border-slate-800 text-slate-500 rounded-xl text-center text-xs">
                    No GPS positioning telemetry reported yet.
                  </div>
                )}
              </div>

              {meter.last_location_update && (
                <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
                  <span>Last Location Refresh:</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(meter.last_location_update).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Geo-mapping Shortcut link */}
              <div className="pt-4">
                <Link
                  href="/map"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl transition-all text-sm font-semibold shadow-lg shadow-orange-950/30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 12l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Inspect Meter on Live Map
                </Link>
              </div>
            </div>
          </div>

          {/* Activity Feeds: Location History and State logs */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Geo-Tracking Log Feed */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold tracking-tight text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Geo-Tracking Log
              </h2>
              
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {locationHistory.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    No location history reports recorded.
                  </div>
                ) : (
                  locationHistory.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="group border border-slate-800/60 hover:border-slate-700/80 bg-slate-950/20 hover:bg-slate-950/60 transition-all rounded-xl p-3.5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-xs text-slate-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {Number(entry.latitude).toFixed(5)}, {Number(entry.longitude).toFixed(5)}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          entry.is_within_threshold 
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                            : 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse'
                        }`}>
                          {Number(entry.distance_from_default).toFixed(1)}m
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 flex justify-between">
                        <span>Report Received:</span>
                        <span className="font-semibold text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Relay Switches Logs Feed */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold tracking-tight text-white mb-4 pb-2 border-b border-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Control History
              </h2>
              
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {statusHistory.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    No relay activation events recorded.
                  </div>
                ) : (
                  statusHistory.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="group border border-slate-800/60 hover:border-slate-700/80 bg-slate-950/20 hover:bg-slate-950/60 transition-all rounded-xl p-3.5"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border tracking-wider ${
                          log.status === 'ON'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                        }`}>
                          RELAY {log.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs pt-1.5">
                        <span className="text-slate-500">Trigger/Reason:</span>
                        <span className="font-semibold text-slate-300 uppercase tracking-wide text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                          {log.reason.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-2 text-right">
                        Timestamp: {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
