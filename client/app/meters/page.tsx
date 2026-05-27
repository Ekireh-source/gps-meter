'use client';

import Link from 'next/link';
import { useMeters } from '@/hooks/useMeters';
import MeterCard from '@/components/meters/MeterCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function MetersPage() {
  const { meters, loading, error, refresh } = useMeters(20000); // Poll every 20 seconds

  const onMeters = meters.filter((m) => m.status === 'ON');
  const offMeters = meters.filter((m) => m.status === 'OFF');
  const onlineMeters = meters.filter((m) => m.connection_status === 'ONLINE');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 pb-16 selection:bg-orange-500 selection:text-white">
      
      {/* Navbar / Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-8 h-8 bg-[#ff5a00] rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20 hover:opacity-90 transition-opacity">
            <span className="text-white font-black text-lg">G</span>
          </Link>
          <span className="text-xl font-bold tracking-tight text-white">
            GPS <span className="text-orange-500">Monitor</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/map"
            className="text-slate-300 hover:text-orange-400 hover:bg-slate-800/50 px-3 py-1.5 rounded-lg transition-all text-sm font-medium"
          >
            Live Map
          </Link>
          <Link
            href="/meters/create"
            className="px-4 py-1.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg transition-all text-xs font-semibold shadow-md shadow-orange-950/20"
          >
            + Create Meter
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative overflow-hidden">
        
        {/* Glow BG */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Registered Smart Meters</h1>
            <p className="text-sm text-slate-400">Manage and monitor all devices registered to your power grid</p>
          </div>

          {/* Counts metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-xl">
              <span className="text-slate-500 font-semibold uppercase tracking-wider">Total</span>
              <span className="ml-2 font-bold text-white text-sm">{meters.length}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-xl">
              <span className="text-emerald-500 font-semibold uppercase tracking-wider">Online</span>
              <span className="ml-2 font-bold text-emerald-400 text-sm">{onlineMeters.length}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-xl">
              <span className="text-blue-500 font-semibold uppercase tracking-wider">Relay ON</span>
              <span className="ml-2 font-bold text-blue-400 text-sm">{onMeters.length}</span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        )}

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
                <p className="text-slate-400 text-sm mb-6">Start tracking locations and electrical loads by adding a new device configuration.</p>
                <Link
                  href="/meters/create"
                  className="inline-block bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
                >
                  Create First Meter
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meters.map((meter) => (
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
