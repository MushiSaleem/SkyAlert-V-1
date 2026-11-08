import React from 'react';
import { SystemDaemonConfig, SystemDaemonStats } from '../types/alert';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Power,
  ShieldCheck,
  Globe,
} from 'lucide-react';

interface SystemHeaderProps {
  config: SystemDaemonConfig;
  stats: SystemDaemonStats;
  isPolling: boolean;
  isFetchingLive?: boolean;
  onToggleArmed: () => void;
  onTriggerPoll: () => void;
  onFetchLiveFeeds: () => void;
  onOpenConfigModal: () => void;
  onOpenIngestModal: () => void;
  onResetSystem: () => void;
}

export const SystemHeader: React.FC<SystemHeaderProps> = ({
  config,
  stats,
  isPolling,
  isFetchingLive = false,
  onToggleArmed,
  onTriggerPoll,
  onFetchLiveFeeds,
  onOpenConfigModal,
  onOpenIngestModal,
  onResetSystem,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#07080d]/80 backdrop-blur-2xl px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="/" className="text-base sm:text-lg font-semibold tracking-tight text-white whitespace-nowrap">
            SkyAlert <span className="font-normal text-slate-400 text-xs sm:text-sm">· Flight Wire</span>
          </a>
          <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-400 border-l border-white/[0.1] pl-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Company Protected Lines</span>
          </span>
        </div>

        {/* Zone 2: Quick Status Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400">
          <span className="hover:text-white transition-colors cursor-default">
            WhatsApp Line {config.whatsAppPhone ? '· Ready' : '· Awaiting Number'}
          </span>
          <span className="hover:text-white transition-colors cursor-default">
            MS Teams {config.msTeamsWebhookUrl ? '· Linked' : '· Standby'}
          </span>
          <span className="hover:text-white transition-colors cursor-default">
            Email Relay {config.emailRecipients ? '· Active' : '· Standby'}
          </span>
          <span className="text-sky-400 cursor-default">
            Deduplication · Armed
          </span>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Armed toggle */}
          <button
            onClick={onToggleArmed}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              config.systemArmed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-white/[0.04] border-white/[0.1] text-slate-400 hover:text-white'
            }`}
            title={config.systemArmed ? 'Pause Wire Polling' : 'Resume Wire Polling'}
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{config.systemArmed ? 'Armed' : 'Paused'}</span>
          </button>

          {/* Fetch Live Feeds Button */}
          <button
            onClick={onFetchLiveFeeds}
            disabled={isFetchingLive}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Fetch real-time USGS Japan earthquakes, FAA airport closures, and IATA airline feeds"
          >
            <Globe className={`w-3.5 h-3.5 ${isFetchingLive ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline">{isFetchingLive ? 'Checking Feeds...' : 'Fetch Live Feeds'}</span>
          </button>

          {/* Trigger Immediate Poll */}
          <button
            onClick={onTriggerPoll}
            disabled={isPolling}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Poll global feeds immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPolling ? 'animate-spin text-slate-400' : ''}`} />
            <span className="hidden sm:inline">Poll Sample</span>
          </button>

          {/* Ingest item */}
          <button
            onClick={onOpenIngestModal}
            className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 font-medium text-xs hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Ingest Alert</span>
          </button>

          {/* Config */}
          <button
            onClick={onOpenConfigModal}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-colors"
            title="Pipeline & Threshold Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Reset */}
          <button
            onClick={onResetSystem}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.08] transition-colors"
            title="Reset Feeds to Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
