import React, { useState } from 'react';
import { IngestedNewsItem, SystemDaemonConfig } from '../types/alert';
import {
  Flame,
  CloudLightning,
  ServerCrash,
  Radio,
  ShieldAlert,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Smartphone,
  Mail,
  ShieldCheck,
  RefreshCw,
  Copy,
  Activity,
  Plane,
  Globe,
} from 'lucide-react';
import { buildWhatsAppShareUrl, formatWhatsAppNotification } from '../utils/notificationFormatters';

interface NewsStreamViewProps {
  newsItems: IngestedNewsItem[];
  config: SystemDaemonConfig;
  selectedItem: IngestedNewsItem | null;
  onSelectItem: (item: IngestedNewsItem) => void;
  onOpenTeamsPreview: (item: IngestedNewsItem) => void;
  onDispatchToTeams: (itemId: string) => void;
  onDispatchToWhatsApp?: (itemId: string) => void;
  onDispatchToEmail?: (itemId: string) => void;
  isDispatching: string | null;
  isDispatchingWhatsApp?: string | null;
  isDispatchingEmail?: string | null;
}

export const NewsStreamView: React.FC<NewsStreamViewProps> = ({
  newsItems,
  config,
  selectedItem,
  onSelectItem,
  onOpenTeamsPreview,
  onDispatchToTeams,
  onDispatchToWhatsApp,
  onDispatchToEmail,
  isDispatching,
  isDispatchingWhatsApp,
  isDispatchingEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'BROADCAST_OUTBOX' | 'TRACKED_DEDUP' | 'NOISE_QUARANTINE' | 'ALL_FEEDS'>('BROADCAST_OUTBOX');
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState<'ALL' | 'JAPAN_SEISMIC' | 'IATA_OPS' | 'AIRLINE_FLEET' | 'VOLCANO'>('ALL');
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSourceIcon = (category: IngestedNewsItem['sourceCategory']) => {
    switch (category) {
      case 'EARTHQUAKE_SEISMIC':
        return <Activity className="w-3.5 h-3.5 text-amber-400" />;
      case 'IATA_AIRLINE_OPS':
        return <Plane className="w-3.5 h-3.5 text-sky-400" />;
      case 'VOLCANO_VAAC':
        return <Flame className="w-3.5 h-3.5 text-orange-400" />;
      case 'INFRASTRUCTURE':
        return <ServerCrash className="w-3.5 h-3.5 text-red-400" />;
      case 'METEOROLOGY':
        return <CloudLightning className="w-3.5 h-3.5 text-cyan-400" />;
      case 'NOTAM':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />;
      case 'NEWS_WIRE':
      default:
        return <Radio className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredItems = newsItems.filter((item) => {
    if (activeTab === 'BROADCAST_OUTBOX') {
      if (item.isFilteredOut || item.isDuplicateDropped) return false;
    } else if (activeTab === 'TRACKED_DEDUP') {
      if (!item.isDuplicateDropped) return false;
    } else if (activeTab === 'NOISE_QUARANTINE') {
      if (!item.isFilteredOut) return false;
    }

    if (sourceCategoryFilter === 'JAPAN_SEISMIC') {
      const isJapan = item.headline.toLowerCase().includes('japan') || item.sourceCategory === 'EARTHQUAKE_SEISMIC' || item.impactedAirports.some(a => ['HND', 'NRT', 'SDJ', 'KIX'].includes(a));
      if (!isJapan) return false;
    } else if (sourceCategoryFilter === 'IATA_OPS') {
      const isIata = item.sourceCategory === 'IATA_AIRLINE_OPS' || item.source.toLowerCase().includes('iata');
      if (!isIata) return false;
    } else if (sourceCategoryFilter === 'AIRLINE_FLEET') {
      const isFleet = item.headline.toLowerCase().includes('fleet') || item.headline.toLowerCase().includes('airline') || item.source.toLowerCase().includes('simpleflying');
      if (!isFleet) return false;
    } else if (sourceCategoryFilter === 'VOLCANO') {
      if (item.sourceCategory !== 'VOLCANO_VAAC') return false;
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      const matchHead = item.headline.toLowerCase().includes(q);
      const matchSource = item.source.toLowerCase().includes(q);
      const matchHub = item.impactedAirports.some((ap) => ap.toLowerCase().includes(q));
      return matchHead || matchSource || matchHub;
    }

    return true;
  });

  const outboxCount = newsItems.filter((i) => !i.isFilteredOut && !i.isDuplicateDropped).length;
  const dedupCount = newsItems.filter((i) => i.isDuplicateDropped).length;
  const noiseCount = newsItems.filter((i) => i.isFilteredOut).length;

  const handleCopyText = (item: IngestedNewsItem) => {
    const text = formatWhatsAppNotification(item);
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 md:p-7 space-y-6">
      {/* Navigation Tabs and Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab('BROADCAST_OUTBOX')}
            className={`px-3.5 py-2 rounded-xl border font-medium flex items-center gap-2 transition-all ${
              activeTab === 'BROADCAST_OUTBOX'
                ? 'bg-white/[0.08] border-white/[0.2] text-white shadow-sm'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Outbox (Med & High Only)</span>
            <span className="font-mono text-[11px] text-slate-300">· {outboxCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('TRACKED_DEDUP')}
            className={`px-3.5 py-2 rounded-xl border font-medium flex items-center gap-2 transition-all ${
              activeTab === 'TRACKED_DEDUP'
                ? 'bg-white/[0.08] border-white/[0.2] text-white shadow-sm'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Tracked (Severity Unchanged — Suppressed)</span>
            <span className="font-mono text-[11px] text-slate-300">· {dedupCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('NOISE_QUARANTINE')}
            className={`px-3.5 py-2 rounded-xl border font-medium flex items-center gap-2 transition-all ${
              activeTab === 'NOISE_QUARANTINE'
                ? 'bg-white/[0.08] border-white/[0.2] text-white shadow-sm'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Noise Quarantine (Ramp / Baggage)</span>
            <span className="font-mono text-[11px] text-slate-300">· {noiseCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL_FEEDS')}
            className={`px-3.5 py-2 rounded-xl border font-medium flex items-center gap-2 transition-all ${
              activeTab === 'ALL_FEEDS'
                ? 'bg-white/[0.08] border-white/[0.2] text-white shadow-sm'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>All Ingested</span>
            <span className="font-mono text-[11px] text-slate-400">· {newsItems.length}</span>
          </button>
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search headline, hub, source..."
            className="w-full px-3.5 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/[0.25]"
          />
        </div>
      </div>

      {/* Domain Quick Filters (Japan Earthquakes, IATA Ops, Airline Fleet, Volcanic Ash) */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs -mt-2">
        <span className="text-[11px] font-medium text-slate-400 mr-1">Filter Feeds:</span>
        <button
          onClick={() => setSourceCategoryFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
            sourceCategoryFilter === 'ALL'
              ? 'bg-white/10 border-white/20 text-white font-medium shadow-sm'
              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          All Feeds
        </button>
        <button
          onClick={() => setSourceCategoryFilter('JAPAN_SEISMIC')}
          className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
            sourceCategoryFilter === 'JAPAN_SEISMIC'
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-medium shadow-sm'
              : 'bg-transparent border-transparent text-slate-400 hover:text-amber-200'
          }`}
        >
          <span>🇯🇵 Japan Earthquakes & Hubs</span>
        </button>
        <button
          onClick={() => setSourceCategoryFilter('IATA_OPS')}
          className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
            sourceCategoryFilter === 'IATA_OPS'
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-medium shadow-sm'
              : 'bg-transparent border-transparent text-slate-400 hover:text-sky-200'
          }`}
        >
          <span>🌐 IATA Operations</span>
        </button>
        <button
          onClick={() => setSourceCategoryFilter('AIRLINE_FLEET')}
          className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
            sourceCategoryFilter === 'AIRLINE_FLEET'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-medium shadow-sm'
              : 'bg-transparent border-transparent text-slate-400 hover:text-emerald-200'
          }`}
        >
          <span>✈️ Airline & Fleet Directives</span>
        </button>
        <button
          onClick={() => setSourceCategoryFilter('VOLCANO')}
          className={`px-2.5 py-1 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
            sourceCategoryFilter === 'VOLCANO'
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-300 font-medium shadow-sm'
              : 'bg-transparent border-transparent text-slate-400 hover:text-orange-200'
          }`}
        >
          <span>🌋 Volcanic Ash / VAAC</span>
        </button>
      </div>

      {/* Stream Items List */}
      <div className="space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No items in this category. System is actively listening for global aviation updates.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const isCrit = item.severity === 'CRITICAL';
            const isHigh = item.severity === 'HIGH';
            const isMed = item.severity === 'MEDIUM';

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={`group relative rounded-2xl border transition-all p-4 md:p-5 cursor-pointer ${
                  isSelected
                    ? 'bg-white/[0.06] border-white/[0.2] shadow-xl'
                    : 'bg-black/20 hover:bg-white/[0.03] border-white/[0.06]'
                }`}
              >
                {/* Header row with unboxed metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      {getSourceIcon(item.sourceCategory)}
                      {item.source}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-400">
                      {new Date(item.ingestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-semibold tracking-wider ${
                        isCrit
                          ? 'text-red-400'
                          : isHigh
                          ? 'text-orange-400'
                          : isMed
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-400">Score {item.priorityScore}/100</span>
                  </div>

                  {/* Fingerprint / Dedup Status Marker */}
                  <div className="text-[11px] font-mono text-slate-400">
                    {item.isDuplicateDropped ? (
                      <span className="text-sky-400 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> Tracked · Severity Unchanged (Suppressed)
                      </span>
                    ) : item.isFilteredOut ? (
                      <span className="text-amber-400">Low Noise Intercepted</span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Pushed to Protected Lines
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Headline */}
                <h3 className="text-sm md:text-base font-medium text-white group-hover:text-cyan-200 transition-colors leading-snug">
                  {item.headline}
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {item.summary}
                </p>

                {/* Flight Impact Numbers */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mt-3 pt-3 border-t border-white/[0.05]">
                  <div>
                    <span className="text-slate-500">Delayed:</span>{' '}
                    <span className="text-white font-medium">~{item.estimatedDelayedFlights.toLocaleString()}</span>
                  </div>
                  <span aria-hidden="true">·</span>
                  <div>
                    <span className="text-slate-500">Cancellations:</span>{' '}
                    <span className="text-white font-medium">~{item.estimatedCancelledFlights.toLocaleString()}</span>
                  </div>
                  <span aria-hidden="true">·</span>
                  <div>
                    <span className="text-slate-500">Delay Ripple:</span>{' '}
                    <span className="text-amber-400 font-medium">+{item.avgDelayMinutes} mins</span>
                  </div>
                  {item.impactedAirports.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <div>
                        <span className="text-slate-500">Hubs:</span>{' '}
                        <span className="text-slate-300">{item.impactedAirports.join(', ')}</span>
                      </div>
                    </>
                  )}
                  {item.notamCode && (
                    <>
                      <span aria-hidden="true">·</span>
                      <div>
                        <span className="text-slate-500">Ref:</span>{' '}
                        <span className="text-slate-400">{item.notamCode}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Channel Delivery Status Bar & Actions for the 3 Protected Lines */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-white/[0.05]">
                  {/* Delivery Status Badges for the 3 lines */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    {/* WhatsApp Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                        item.whatsAppDispatch?.dispatched
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-500'
                      }`}
                    >
                      <Smartphone className="w-3 h-3 text-emerald-400" />
                      <span>WhatsApp:</span>
                      <span>
                        {item.whatsAppDispatch?.dispatched ? 'Delivered' : item.isDuplicateDropped ? 'Suppressed' : 'Pending'}
                      </span>
                    </div>

                    {/* MS Teams Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                        item.teamsDispatch?.dispatched
                          ? 'bg-indigo-950/30 border-[#5059C9]/30 text-indigo-300'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-500'
                      }`}
                    >
                      <Send className="w-3 h-3 text-[#5059C9]" />
                      <span>MS Teams:</span>
                      <span>
                        {item.teamsDispatch?.dispatched ? 'Delivered' : item.isDuplicateDropped ? 'Suppressed' : 'Pending'}
                      </span>
                    </div>

                    {/* Email Line Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                        item.emailDispatch?.dispatched
                          ? 'bg-sky-950/30 border-sky-500/30 text-sky-300'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-500'
                      }`}
                    >
                      <Mail className="w-3 h-3 text-sky-400" />
                      <span>Email:</span>
                      <span>
                        {item.emailDispatch?.dispatched ? 'Delivered' : item.isDuplicateDropped ? 'Suppressed' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleCopyText(item)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[11px] flex items-center gap-1 border border-white/[0.06] transition-colors"
                      title="Copy alert notification text"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => onOpenTeamsPreview(item)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-[11px] flex items-center gap-1 border border-white/[0.06] transition-colors"
                    >
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>Preview Card</span>
                    </button>

                    {onDispatchToWhatsApp && (
                      <button
                        onClick={() => onDispatchToWhatsApp(item.id)}
                        disabled={isDispatchingWhatsApp === item.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[11px] flex items-center gap-1 transition-all"
                      >
                        {isDispatchingWhatsApp === item.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                        )}
                        <span>Push WhatsApp</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDispatchToTeams(item.id)}
                      disabled={isDispatching === item.id}
                      className="px-2.5 py-1 rounded-lg bg-[#5059C9]/20 hover:bg-[#5059C9]/30 text-[#9da5ff] border border-[#5059C9]/40 text-[11px] flex items-center gap-1 transition-all"
                    >
                      {isDispatching === item.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3 text-[#5059C9]" />
                      )}
                      <span>Push Teams</span>
                    </button>

                    {onDispatchToEmail && (
                      <button
                        onClick={() => onDispatchToEmail(item.id)}
                        disabled={isDispatchingEmail === item.id}
                        className="px-2.5 py-1 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 border border-sky-500/30 text-[11px] flex items-center gap-1 transition-all"
                      >
                        {isDispatchingEmail === item.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Mail className="w-3 h-3 text-sky-400" />
                        )}
                        <span>Push Email</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
