import React, { useState } from 'react';
import { IngestedNewsItem } from '../types/alert';
import {
  X,
  Sparkles,
  Flame,
  CloudLightning,
  Radio,
  Filter,
  Send,
  AlertTriangle,
  ServerCrash,
  CheckCircle2,
} from 'lucide-react';

interface IngestNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestNews: (headline: string, summary: string, source: string, category: IngestedNewsItem['sourceCategory']) => Promise<IngestedNewsItem>;
}

export const IngestNewsModal: React.FC<IngestNewsModalProps> = ({
  isOpen,
  onClose,
  onIngestNews,
}) => {
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [source, setSource] = useState('Reuters Global Aviation Wire');
  const [category, setCategory] = useState<IngestedNewsItem['sourceCategory']>('VOLCANO_VAAC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultItem, setResultItem] = useState<IngestedNewsItem | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) return;

    setIsSubmitting(true);
    setResultItem(null);
    try {
      const item = await onIngestNews(headline, summary, source, category);
      setResultItem(item);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreset = async (
    pHeadline: string,
    pSummary: string,
    pSource: string,
    pCategory: IngestedNewsItem['sourceCategory']
  ) => {
    setIsSubmitting(true);
    setResultItem(null);
    try {
      const item = await onIngestNews(pHeadline, pSummary, pSource, pCategory);
      setResultItem(item);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-mono animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-cyan-950 bg-[#040813] shadow-2xl overflow-hidden text-xs text-slate-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Ingest News Wire / Test Noise Filtration
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Submit news text or choose presets to verify automatic noise filtering and MS Teams channel alerts
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Preset Buttons */}
          <div>
            <span className="font-bold text-white block mb-2">
              ⚡ Quick Wire Presets (1-Click Pipeline Test):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handlePreset(
                    'Sub-Glacial Volcano Ash Ejection to FL370 Closes Icelandic & UK Airspace Gates',
                    'Abrasive volcanic ash drifting across North Atlantic oceanic entry points. Shanwick issues red closure notice.',
                    'VAAC London Advisory',
                    'VOLCANO_VAAC'
                  )
                }
                disabled={isSubmitting}
                className="p-2.5 rounded-xl border border-red-900/60 bg-red-950/20 hover:bg-red-950/40 text-left transition-all"
              >
                <div className="text-red-300 font-bold flex items-center gap-1.5 mb-0.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>🌋 Volcanic Ash Plume (Critical)</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Expected: Score 92/100 • Dispatches to MS Teams
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePreset(
                    'Category 5 Super Typhoon with 160kt Winds Imposes Haneda & Narita Ground Stop',
                    'Extremely dangerous eye approaching Tokyo Bay. Inbound flights diverted to Sapporo and Osaka.',
                    'Japan Meteorological Agency',
                    'METEOROLOGY'
                  )
                }
                disabled={isSubmitting}
                className="p-2.5 rounded-xl border border-amber-900/60 bg-amber-950/20 hover:bg-amber-950/40 text-left transition-all"
              >
                <div className="text-amber-300 font-bold flex items-center gap-1.5 mb-0.5">
                  <CloudLightning className="w-3.5 h-3.5 text-cyan-400" />
                  <span>🌀 Super Typhoon Ground Stop (High)</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Expected: Score 78/100 • Dispatches to MS Teams
                </div>
              </button>

              {/* Noise Preset */}
              <button
                type="button"
                onClick={() =>
                  handlePreset(
                    'Terminal Baggage Carousel Jam at Vienna Gate 14 Causes 16-Minute Delay',
                    'Single regional shuttle flight delayed due to electric belt overload. Normal operations resumed.',
                    'VIE Ramp VHF Log',
                    'NEWS_WIRE'
                  )
                }
                disabled={isSubmitting}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-900/80 text-left transition-all"
              >
                <div className="text-slate-300 font-bold flex items-center gap-1.5 mb-0.5">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span>🧳 Baggage Carousel Jam (Low Noise)</span>
                </div>
                <div className="text-[10px] text-amber-400 font-bold">
                  Expected: Score 16/100 • DROPPED AS NOISE
                </div>
              </button>

              {/* Noise Preset 2 */}
              <button
                type="button"
                onClick={() =>
                  handlePreset(
                    'Denver Remote Stand 41 Pushback Tug Fluid Drip Delays Flight UA512 by 12 Minutes',
                    'Ground equipment swapped out by maintenance technician. Single aircraft gate hold.',
                    'DEN Station Ops',
                    'NEWS_WIRE'
                  )
                }
                disabled={isSubmitting}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-900/80 text-left transition-all"
              >
                <div className="text-slate-300 font-bold flex items-center gap-1.5 mb-0.5">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span>🛞 Ground Tug Leak (Low Noise)</span>
                </div>
                <div className="text-[10px] text-amber-400 font-bold">
                  Expected: Score 18/100 • DROPPED AS NOISE
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <span className="font-bold text-white block mb-2">
              Or Ingest Custom News Headline:
            </span>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Headline:</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Major solar geomagnetic storm wipes out HF communication across Arctic polar corridors..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-2 text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Details / Synopsis:</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Optional details or NOTAM bulletin text..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg p-2 text-xs outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Wire Source:</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Category:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IngestedNewsItem['sourceCategory'])}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs outline-none"
                  >
                    <option value="VOLCANO_VAAC">Volcanic Ash / VAAC</option>
                    <option value="METEOROLOGY">Severe Meteorology (Storm/Typhoon)</option>
                    <option value="INFRASTRUCTURE">Aviation IT / Infrastructure Outage</option>
                    <option value="NOTAM">Airspace NOTAM Restriction</option>
                    <option value="NEWS_WIRE">General News Wire</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !headline.trim()}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Filtering & Evaluating...' : 'Ingest & Filter News'}</span>
              </button>
            </form>
          </div>

          {/* Result Card */}
          {resultItem && (
            <div
              className={`p-3.5 rounded-xl border animate-in fade-in duration-200 ${
                resultItem.isFilteredOut
                  ? 'border-amber-700 bg-amber-950/20'
                  : 'border-emerald-600 bg-emerald-950/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    resultItem.isFilteredOut
                      ? 'bg-slate-800 border-slate-700 text-slate-300'
                      : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  }`}
                >
                  {resultItem.isFilteredOut
                    ? 'DROPPED AS LOW NOISE'
                    : `QUALIFIED FOR MS TEAMS (${resultItem.severity})`}
                </span>
                <span className="text-[11px] text-white">
                  Score: <strong>{resultItem.priorityScore}</strong>/100
                </span>
              </div>

              <h4 className="text-xs font-bold text-white mb-1">
                {resultItem.headline}
              </h4>
              <p className="text-[11px] text-slate-300 mb-2">
                {resultItem.filterReason}
              </p>

              <div className="text-[11px] font-bold text-slate-400">
                Teams Webhook Status:{' '}
                <span className={resultItem.isFilteredOut ? 'text-amber-400' : 'text-emerald-400'}>
                  {resultItem.isFilteredOut
                    ? 'BLOCKED (0 spam sent to Teams)'
                    : 'DISPATCHED (Adaptive Card sent to Teams)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 px-5 py-3 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
