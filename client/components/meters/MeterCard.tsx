'use client';

import Link from 'next/link';
import type { Meter } from '@/lib/types';

interface MeterCardProps {
  meter: Meter;
}

export default function MeterCard({ meter }: MeterCardProps) {
  const isOnline = meter.connection_status === 'ONLINE';
  const isRelayOn = meter.status === 'ON';

  return (
    <Link href={`/meters/${meter.meter_id}`}>
      <div className="relative overflow-hidden bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 hover:bg-slate-900/75 hover:shadow-xl hover:shadow-black/20 transition-all cursor-pointer group select-none">
        
        {/* Subtle orange indicator if tampered */}
        {meter.tamper && (
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
        )}

        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-orange-500 transition-colors truncate max-w-[200px]">
              {meter.name}
            </h3>
            <p className="text-xs text-slate-500 font-mono">ID: <span className="text-slate-400 font-semibold">{meter.meter_id}</span></p>
          </div>
          
          <div className="flex items-center gap-2">
            {meter.tamper && (
              <span className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 uppercase tracking-wider animate-pulse">
                TAMPER
              </span>
            )}
            
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
              isOnline 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700/60'
            }`}>
              <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {meter.connection_status}
            </div>
          </div>
        </div>
        
        <div className="space-y-2.5 text-xs">
          {/* Row 1: Units and Balance */}
          <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-orange-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Available Credit
            </span>
            <div className="text-right">
              <span className="font-bold text-slate-100 block">
                {meter.available_units !== null ? `${Number(meter.available_units).toFixed(1)} Units` : '--'}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold block">
                Balance: ${meter.current_balance !== null ? Number(meter.current_balance).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
          
          {/* Row 2: Status */}
          <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-blue-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Relay Switch Status
            </span>
            <span className={`px-2 py-0.5 rounded-md font-extrabold uppercase border text-[10px] tracking-wide ${
              isRelayOn 
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' 
                : 'bg-red-950/30 text-red-400 border-red-500/20'
            }`}>
              {meter.status}
            </span>
          </div>
          
          {/* Row 3: Security geo-fence */}
          <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 12l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Geo-Fence Radius
            </span>
            <div className="text-right">
              <span className={`font-bold block ${meter.within_threshold ? 'text-emerald-400' : 'text-red-400'}`}>
                {meter.within_threshold ? 'Secured' : 'Breached'}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold block">
                Radius: {Number(meter.threshold_distance).toFixed(0)}m
              </span>
            </div>
          </div>
          
          {/* Row 4: Coordinates */}
          {meter.current_latitude !== null && meter.current_longitude !== null ? (
            <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Position Trail
              </span>
              <span className="font-mono font-semibold text-slate-300 text-[10px]">
                {Number(meter.current_latitude).toFixed(4)}, {Number(meter.current_longitude).toFixed(4)}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between py-2 border-b border-slate-800/80 text-[10px] text-slate-600 italic">
              <span>Position Trail</span>
              <span>No active pings</span>
            </div>
          )}

          {/* Row 5: Last Seen */}
          {meter.last_seen && (
            <div className="pt-2 text-[10px] text-slate-500 flex justify-between">
              <span>Last Reported Telemetry:</span>
              <span className="font-semibold text-slate-400">
                {new Date(meter.last_seen).toLocaleDateString()} at {new Date(meter.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
