'use client';

import Link from 'next/link';
import { useMapData } from '@/hooks/useMapData';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import MeterMap from '@/components/map/MeterMap';

export default function MapPage() {
  const { meters, loading, error, refresh } = useMapData(10000); // Poll every 10 seconds

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Header navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/85 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-8 h-8 bg-[#ff5a00] rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20 hover:opacity-90 transition-opacity">
            <span className="text-white font-black text-lg">G</span>
          </Link>
          <div className="h-6 w-px bg-slate-800"></div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Live Map Positioning</h1>
            <p className="text-[10px] text-slate-400 font-medium">
              {meters.length} {meters.length === 1 ? 'device' : 'devices'} active on grid
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <button 
            onClick={refresh}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-800 hover:border-slate-700"
            title="Refresh Map Data"
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
          <Link
            href="/meters"
            className="px-4 py-1.5 bg-slate-850 hover:bg-slate-750 text-slate-200 border border-slate-750 rounded-lg transition-all text-xs font-semibold"
          >
            Meters
          </Link>
        </nav>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        {loading && meters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
            <LoadingSpinner />
          </div>
        )}
        
        {error && meters.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10 p-6">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
              <ErrorMessage 
                message={error.message || "Failed to retrieve map positioning data."} 
                onRetry={refresh} 
              />
            </div>
          </div>
        )}

        {error && meters.length > 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 max-w-md w-full px-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
              <ErrorMessage 
                message={`Connection dropped: ${error.message}. Showing cached positioning.`} 
                onRetry={refresh} 
              />
            </div>
          </div>
        )}

        {(meters.length > 0 || (!loading && !error)) && (
          <MeterMap meters={meters} showThreshold={true} />
        )}
      </div>
    </div>
  );
}
