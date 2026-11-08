import React, { useState } from 'react';
import { SystemDaemonConfig, IngestedNewsItem } from '../types/alert';
import {
  X,
  Check,
  Send,
  AlertTriangle,
  Info,
  ShieldCheck,
  Sliders,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface TeamsChannelConfigModalProps {
  config: SystemDaemonConfig;
  sampleItem: IngestedNewsItem;
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (newConfig: SystemDaemonConfig) => Promise<void>;
  onTestTeamsWebhook: (webhookUrl: string) => Promise<{ receipt: { dispatched: boolean; responseDetail?: string } }>;
}

export const TeamsChannelConfigModal: React.FC<TeamsChannelConfigModalProps> = ({
  config,
  sampleItem,
  isOpen,
  onClose,
  onSaveConfig,
  onTestTeamsWebhook,
}) => {
  const [localConfig, setLocalConfig] = useState<SystemDaemonConfig>({ ...config });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; detail: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(localConfig);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPing = async () => {
    if (!localConfig.msTeamsWebhookUrl) {
      setTestResult({
        success: false,
        detail: 'Please enter a valid MS Teams Webhook URL first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestTeamsWebhook(localConfig.msTeamsWebhookUrl);
      setTestResult({
        success: res.receipt.dispatched,
        detail: res.receipt.responseDetail || 'Completed ping test.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({ success: false, detail: msg });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md font-mono animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-cyan-950 bg-[#040813] shadow-2xl overflow-hidden text-xs text-slate-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/80">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5059C9]"></span>
              Microsoft Teams Channel Notification Setup
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Target channel endpoint for real-time Medium and High flight disruption broadcasts
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
          {/* Webhook URL Input */}
          <div className="space-y-2">
            <label className="block text-white font-bold">
              MS Teams Incoming Webhook / Workflow URL:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={localConfig.msTeamsWebhookUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, msTeamsWebhookUrl: e.target.value })}
                placeholder="https://outlook.office.com/webhook/... or Power Automate URL"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-[#5059C9] text-white rounded-lg px-3 py-2 text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isTesting || !localConfig.msTeamsWebhookUrl}
                className="px-3.5 py-2 bg-[#5059C9] hover:bg-[#5f68dc] text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Pinging...' : 'Test Ping'}</span>
              </button>
            </div>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300'
                  : 'bg-red-950/40 border-red-600 text-red-300'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="block font-bold">
                  {testResult.success ? 'Teams Channel Verified!' : 'Teams Dispatch Failed'}
                </strong>
                <span>{testResult.detail}</span>
              </div>
            </div>
          )}

          {/* Setup Guide */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-[11px] text-slate-400">
            <h5 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4 text-cyan-400" />
              How to configure your MS Teams channel webhook:
            </h5>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>In Microsoft Teams, right click your desired alert channel (e.g. <em>#flight-ops</em>).</li>
              <li>Select <strong>Workflows</strong> &gt; search for <strong>"Post to a channel when a webhook request is received"</strong>.</li>
              <li>Or select <strong>Connectors</strong> &gt; add <strong>Incoming Webhook</strong>.</li>
              <li>Copy the generated Webhook URL and paste it into the field above.</li>
            </ol>
          </div>

          {/* Noise Filtration Rules Section */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="font-bold text-white text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Noise Filter & Dispatch Rules:
            </h4>

            {/* Severity Threshold */}
            <div>
              <label className="block text-slate-400 mb-1.5">
                Minimum Disruption Severity to Alert MS Teams:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocalConfig({ ...localConfig, minSeverity: 'MEDIUM' })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    localConfig.minSeverity === 'MEDIUM'
                      ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>Medium & High / Critical</div>
                  <div className="text-[10px] text-slate-400">(Filters out all low-level noise)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setLocalConfig({ ...localConfig, minSeverity: 'HIGH' })}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    localConfig.minSeverity === 'HIGH'
                      ? 'bg-amber-950/70 border-amber-500 text-amber-200 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <div>High & Critical Only</div>
                  <div className="text-[10px] text-slate-400">(Major Hubs & Oceanic Tracks)</div>
                </button>
              </div>
            </div>

            {/* Minimum Flight Impact Volume Slider */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Minimum Flights Delayed Threshold:</span>
                <span className="text-cyan-400 font-bold">{localConfig.minFlightImpact} flights</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={localConfig.minFlightImpact}
                onChange={(e) => setLocalConfig({ ...localConfig, minFlightImpact: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Incidents below {localConfig.minFlightImpact} flights are classified as station noise and dropped.
              </p>
            </div>

            {/* Automated Dispatch Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <strong className="block text-white">Automated Teams Dispatch</strong>
                <span className="text-[10px] text-slate-400">
                  Immediately pushes qualified disaster events into your Teams channel without delay.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.autoDispatchTeams}
                  onChange={(e) => setLocalConfig({ ...localConfig, autoDispatchTeams: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5059C9]"></div>
              </label>
            </div>

            {/* Stateful Incident Deduplication Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <strong className="block text-white">Stateful Incident Deduplication</strong>
                <span className="text-[10px] text-slate-400">
                  Suppresses duplicate alerts for the same incident if its severity has not changed. Protects company lines from spam.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.dedupEnabled ?? true}
                  onChange={(e) => setLocalConfig({ ...localConfig, dedupEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3.5 bg-slate-950">
          <div>
            {savedSuccess && (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5" /> System Configuration Saved!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
