import React, { useState } from 'react';
import { IngestedNewsItem } from '../types/alert';
import { X, Send, Copy, Check, Code, ExternalLink } from 'lucide-react';
import { buildTeamsAdaptiveCard, buildTeamsMessageCard } from '../utils/notificationFormatters';

interface TeamsCardPreviewModalProps {
  item: IngestedNewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatchToTeams: (itemId: string) => void;
  isDispatching: boolean;
}

export const TeamsCardPreviewModal: React.FC<TeamsCardPreviewModalProps> = ({
  item,
  isOpen,
  onClose,
  onDispatchToTeams,
  isDispatching,
}) => {
  const [viewMode, setViewMode] = useState<'RENDERED' | 'JSON'>('RENDERED');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const messageCardPayload = buildTeamsMessageCard(item);
  const adaptiveCardPayload = buildTeamsAdaptiveCard(item);

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(messageCardPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isCrit = item.severity === 'CRITICAL';
  const isHigh = item.severity === 'HIGH';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-mono animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-cyan-950 bg-[#040813] shadow-2xl overflow-hidden text-xs text-slate-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-950">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                item.isFilteredOut
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : isCrit
                  ? 'bg-red-950 border-red-500 text-red-300'
                  : isHigh
                  ? 'bg-amber-950 border-amber-500 text-amber-300'
                  : 'bg-cyan-950 border-cyan-500 text-cyan-300'
              }`}
            >
              {item.severity} • Score: {item.priorityScore}/100
            </span>
            <h3 className="text-sm font-bold text-white truncate max-w-md">
              MS Teams Card Dispatch Preview
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('RENDERED')}
              className={`px-3 py-1 rounded-lg border transition-all ${
                viewMode === 'RENDERED'
                  ? 'bg-[#5059C9]/20 border-[#5059C9] text-indigo-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Rendered MS Teams Message
            </button>
            <button
              onClick={() => setViewMode('JSON')}
              className={`px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                viewMode === 'JSON'
                  ? 'bg-cyan-950 border-cyan-600 text-cyan-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Card JSON Payload</span>
            </button>
          </div>

          {viewMode === 'JSON' && (
            <button
              onClick={copyPayload}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {viewMode === 'RENDERED' ? (
            <div className="max-w-xl mx-auto rounded-xl border border-slate-700 bg-[#1f1f23] p-4 text-slate-200 shadow-2xl font-sans">
              {/* Teams Message Top Identity */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
                <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white text-xs">
                  SA
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    SkyAlert Flight Disruption Bot <span className="text-[10px] px-1 bg-slate-700 rounded text-slate-300">BOT</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Dispatched via Webhook to this channel
                  </div>
                </div>
              </div>

              {/* Urgency Banner */}
              <div
                className={`rounded-lg p-3 mb-3 border ${
                  isCrit
                    ? 'bg-red-950/40 border-red-600 text-red-200'
                    : isHigh
                    ? 'bg-amber-950/40 border-amber-600 text-amber-200'
                    : 'bg-cyan-950/40 border-cyan-600 text-cyan-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span>🚨 [{item.severity} FLIGHT DISRUPTION]</span>
                  <span>Priority Score: {item.priorityScore}/100</span>
                </div>
                <h4 className="text-sm font-bold text-white leading-snug">
                  {item.headline}
                </h4>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {item.summary}
              </p>

              {/* Facts Table */}
              <div className="rounded-lg bg-[#27272b] p-3 border border-slate-700 mb-3 text-xs">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Delayed Flights:</span>
                    <strong className="text-amber-400 font-mono">{item.estimatedDelayedFlights.toLocaleString()} flights</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cancellations:</span>
                    <strong className="text-red-400 font-mono">{item.estimatedCancelledFlights.toLocaleString()} flights</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Average Delay:</span>
                    <strong className="text-cyan-300 font-mono">+{item.avgDelayMinutes} mins</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Impacted Hubs:</span>
                    <strong className="text-white font-mono">{item.impactedAirports.join(', ')}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Airspace & Corridors:</span>
                    <span className="text-slate-200 font-mono">{item.primaryCorridors.concat(item.impactedFIRs).join(' | ')}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">NOTAM Reference:</span>
                    <span className="text-cyan-300 font-mono text-[11px]">{item.notamCode || 'URGENT NOTAM'}</span>
                  </div>
                </div>
              </div>

              {/* Command Directive */}
              <div className="rounded-lg bg-cyan-950/30 border border-cyan-800 p-2.5 text-xs text-cyan-200 mb-3 font-mono">
                <strong>Directive:</strong> {item.recommendedAction || 'Execute contingency reroutes and alert stations.'}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button className="flex-1 py-1.5 px-3 rounded bg-[#5059C9] hover:bg-[#5f68dc] text-white text-xs font-semibold">
                  Acknowledge in MS Teams
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 overflow-x-auto text-emerald-400 text-xs">
              <pre>{JSON.stringify(messageCardPayload, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3.5 bg-slate-950">
          <div className="text-slate-400 text-[11px]">
            Delivery Status:{' '}
            <strong className="text-white">
              {item.teamsDispatch?.dispatched ? 'Delivered' : 'Pending'}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {!item.isFilteredOut && (
              <button
                onClick={() => onDispatchToTeams(item.id)}
                disabled={isDispatching}
                className="px-3.5 py-1.5 rounded bg-[#5059C9] hover:bg-[#5f68dc] text-white font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDispatching ? 'Pushing...' : 'Push to Teams Now'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
