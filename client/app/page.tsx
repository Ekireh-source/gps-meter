'use client';

import Link from 'next/link';
import { useMeters } from '@/hooks/useMeters';
import MeterCard from '@/components/meters/MeterCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function HomePage() {
  const { meters, loading, error, refresh } = useMeters(15000); // Poll every 15 seconds

  const onMeters = meters.filter((m) => m.status === 'ON');
  const offMeters = meters.filter((m) => m.status === 'OFF');
  const onlineMeters = meters.filter((m) => m.connection_status === 'ONLINE');
  const tamperedMeters = meters.filter((m) => m.tamper);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 pb-16 selection:bg-orange-500 selection:text-white">
      
      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#ff5a00] rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-white font-black text-lg">G</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            GPS <span className="text-orange-500">Monitor</span>
          </span>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            href="/map"
            className="text-slate-300 hover:text-orange-400 hover:bg-slate-800/50 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
          >
            Live Map
          </Link>
          <Link
            href="/meters"
            className="text-slate-300 hover:text-orange-400 hover:bg-slate-800/50 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
          >
            Meters List
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Hero / Banner Block */}
        <div className="mb-16 text-center lg:text-left lg:flex items-center justify-between gap-12 relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
              Monitor Smart Meters <br className="hidden md:inline" />
              From <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300">Anywhere in the World</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-xl">
              Real-time electrical diagnostics, location tracking, anti-tamper security, and automated boundary protection in one premium hub.
            </p>
            
            {/* Call to Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link
                href="/meters/create"
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl transition-all font-semibold shadow-lg shadow-orange-950/40 transform hover:-translate-y-0.5 text-sm"
              >
                + Register New Meter
              </Link>
              <Link
                href="/map"
                className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all font-semibold text-sm"
              >
                Launch Live Map
              </Link>
            </div>
          </div>

          {/* Quick Metrics Widget */}
          <div className="mt-12 lg:mt-0 grid grid-cols-2 gap-4 w-full max-w-md mx-auto lg:mx-0">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Registered</span>
              <p className="text-4xl font-extrabold text-white mt-1">{meters.length}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Online Devices</span>
              <p className="text-4xl font-extrabold text-emerald-400 mt-1">{onlineMeters.length}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Relay Output: ON</span>
              <p className="text-4xl font-extrabold text-white mt-1">{onMeters.length}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm border-red-500/20">
              <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Tamper Alarms</span>
              <p className={`text-4xl font-extrabold mt-1 ${tamperedMeters.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                {tamperedMeters.length}
              </p>
            </div>
          </div>
        </div>

        {/* Live Meters Feed Title */}
        <div className="mb-8 flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-1">Live Telemetry Feed</h3>
            <p className="text-xs text-slate-400">Showing recently updated meters</p>
          </div>
          <Link
            href="/meters"
            className="text-xs font-semibold text-orange-500 hover:text-orange-400 flex items-center gap-1 hover:underline transition-all"
          >
            Manage all {meters.length} meters →
          </Link>
        </div>

        {loading && (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

        {/* Meters Display */}
        {!loading && (
          <div className="relative z-10">
            {meters.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-16 text-center max-w-xl mx-auto shadow-xl">
                <div className="w-16 h-16 bg-slate-800/80 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">No registered meters found</h4>
                <p className="text-slate-400 text-sm mb-6">Create your first smart meter tracking instance to begin monitoring live coordinates and loads.</p>
                <Link
                  href="/meters/create"
                  className="inline-block bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
                >
                  Register First Meter
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meters.slice(0, 6).map((meter) => (
                  <MeterCard key={meter.id} meter={meter} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
