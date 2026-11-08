import React from 'react';
import { SystemDaemonStats, SystemDaemonConfig } from '../types/alert';
import {
  Rss,
  Filter,
  Send,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Mail,
  Zap,
} from 'lucide-react';

interface PipelineVisualizerProps {
  stats: SystemDaemonStats;
  config: SystemDaemonConfig;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ stats, config }) => {
  const noiseDropPct =
    stats.totalNewsIngested > 0
      ? Math.round((stats.droppedNoiseCount / stats.totalNewsIngested) * 100)
      : 0;

  return (
    <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 md:p-6 space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <div className="text-xs text-slate-400">Architecture Pipeline</div>
          <h2 className="text-base md:text-lg font-medium text-white tracking-tight">
            Ingestion, Noise Interception & Company Broadcast Flow
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>Uptime: <strong className="text-white tabular-nums">{Math.floor(stats.uptimeSeconds / 60)}m {stats.uptimeSeconds % 60}s</strong></span>
          <span aria-hidden="true">·</span>
          <span>Polling Rate: <strong className="text-white tabular-nums">{config.pollingIntervalSeconds}s</strong></span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Armed & Active
          </span>
        </div>
      </div>

      {/* 3 Process Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1: Ingestion */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-slate-300">Phase 01</span>
            <Rss className="w-4 h-4 text-slate-400" />
          </div>

          <h3 className="text-sm font-medium text-white">
            Global Aviation Wire Ingestion
          </h3>

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Total Ingested:</span>
              <span className="text-white font-mono tabular-nums">{stats.totalNewsIngested} reports</span>
            </div>
            <div className="flex justify-between">
              <span>Sources:</span>
              <span className="text-slate-300">USGS Japan, IATA AIDX, FAA NAS, SimpleFlying</span>
            </div>
            <div className="flex justify-between">
              <span>Frequency:</span>
              <span className="text-emerald-400 font-mono">Real-Time Polling</span>
            </div>
          </div>
        </div>

        {/* Stage 2: Noise Filtration & Deduplication */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-amber-400">Phase 02</span>
            <Filter className="w-4 h-4 text-amber-400" />
          </div>

          <h3 className="text-sm font-medium text-white">
            Noise Filter & Incident Tracking
          </h3>

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Low Noise Intercepted:</span>
              <span className="text-amber-400 font-mono tabular-nums">
                {stats.droppedNoiseCount} ({noiseDropPct}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Duplicates Suppressed:</span>
              <span className="text-sky-400 font-mono tabular-nums">
                {stats.droppedDuplicateCount || 0} alerts
              </span>
            </div>
            <div className="flex justify-between">
              <span>Severity Policy:</span>
              <span className="text-white font-mono">Medium & High Only</span>
            </div>
          </div>
        </div>

        {/* Stage 3: Multi-Channel Protected Lines */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-emerald-400">Phase 03</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>

          <h3 className="text-sm font-medium text-white">
            Company Protected Lines Broadcast
          </h3>

          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3 h-3 text-emerald-400" /> WhatsApp Line:
              </span>
              <span className="text-emerald-300 font-mono tabular-nums">
                {stats.whatsAppDispatches || 0} pushed
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Send className="w-3 h-3 text-[#5059C9]" /> MS Teams Line:
              </span>
              <span className="text-indigo-300 font-mono tabular-nums">
                {stats.teamsDispatches || 0} pushed
              </span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-sky-400" /> Email Line:
              </span>
              <span className="text-sky-300 font-mono tabular-nums">
                {stats.emailDispatches || 0} pushed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
