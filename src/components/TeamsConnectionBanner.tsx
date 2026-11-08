import React, { useState, useEffect } from 'react';
import { IngestedNewsItem, SystemDaemonConfig } from '../types/alert';
import {
  Send,
  Check,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Server,
  Zap,
} from 'lucide-react';
import {
  formatWhatsAppNotification,
  buildWhatsAppShareUrl,
  formatEmailNotification,
} from '../utils/notificationFormatters';

interface TeamsConnectionBannerProps {
  config: SystemDaemonConfig;
  latestItem: IngestedNewsItem | null;
  onSaveWebhookUrl: (url: string) => Promise<void>;
  onTestWelcomeMessage: (url: string) => Promise<{ success: boolean; detail: string }>;
  onSaveWhatsAppConfig: (patch: Partial<SystemDaemonConfig>) => Promise<void>;
  onTestWhatsApp: (
    phone: string,
    apiKey: string,
    webhookUrl: string,
    method: 'CLICK_TO_CHAT' | 'OPENWA' | 'CALLMEBOT' | 'WEBHOOK',
    openWaParams?: {
      serverUrl?: string;
      sessionId?: string;
      apiKey?: string;
      chatId?: string;
    }
  ) => Promise<{ receipt: { dispatched: boolean; responseDetail?: string } }>;
  onSaveEmailConfig?: (patch: Partial<SystemDaemonConfig>) => Promise<void>;
  onTestEmail?: (
    recipients: string,
    sender?: string,
    smtpHost?: string
  ) => Promise<{ receipt: { dispatched: boolean; responseDetail?: string } }>;
}

export const TeamsConnectionBanner: React.FC<TeamsConnectionBannerProps> = ({
  config,
  latestItem,
  onSaveWebhookUrl,
  onTestWelcomeMessage,
  onSaveWhatsAppConfig,
  onTestWhatsApp,
  onSaveEmailConfig,
  onTestEmail,
}) => {
  const [activeLine, setActiveLine] = useState<'WHATSAPP' | 'TEAMS' | 'EMAIL'>('WHATSAPP');

  // Line 1: WhatsApp state
  const [waPhone, setWaPhone] = useState(config.whatsAppPhone || '');
  const [openWaServerUrl, setOpenWaServerUrl] = useState(config.openWaServerUrl || 'http://localhost:2785');
  const [openWaSessionId, setOpenWaSessionId] = useState(config.openWaSessionId || 'default');
  const [openWaApiKey, setOpenWaApiKey] = useState(config.openWaApiKey || '');
  const [waAutoDispatch, setWaAutoDispatch] = useState(config.autoDispatchWhatsApp ?? true);
  const [isSendingWaTest, setIsSendingWaTest] = useState(false);
  const [waTestResponse, setWaTestResponse] = useState<{ success: boolean; detail: string } | null>(null);

  // Line 2: MS Teams state
  const [teamsWebhook, setTeamsWebhook] = useState(config.msTeamsWebhookUrl || '');
  const [teamsAutoDispatch, setTeamsAutoDispatch] = useState(config.autoDispatchTeams ?? true);
  const [isSendingTeamsTest, setIsSendingTeamsTest] = useState(false);
  const [teamsTestResponse, setTeamsTestResponse] = useState<{ success: boolean; detail: string } | null>(null);

  // Line 3: Email state
  const [emailRecipients, setEmailRecipients] = useState(config.emailRecipients || 'ops-crisis@company-lines.aero');
  const [emailSender, setEmailSender] = useState(config.emailSender || 'skyalert-daemon@aviation-relay.aero');
  const [emailSmtpHost, setEmailSmtpHost] = useState(config.emailSmtpHost || 'smtp.company-lines.internal:587');
  const [emailAutoDispatch, setEmailAutoDispatch] = useState(config.autoDispatchEmail ?? true);
  const [isSendingEmailTest, setIsSendingEmailTest] = useState(false);
  const [emailTestResponse, setEmailTestResponse] = useState<{ success: boolean; detail: string } | null>(null);

  // Keep state synced
  useEffect(() => {
    if (config.whatsAppPhone) setWaPhone(config.whatsAppPhone);
    if (config.openWaServerUrl) setOpenWaServerUrl(config.openWaServerUrl);
    if (config.openWaSessionId) setOpenWaSessionId(config.openWaSessionId);
    if (config.openWaApiKey) setOpenWaApiKey(config.openWaApiKey);
    if (config.msTeamsWebhookUrl) setTeamsWebhook(config.msTeamsWebhookUrl);
    if (config.emailRecipients) setEmailRecipients(config.emailRecipients);
    if (config.emailSender) setEmailSender(config.emailSender);
    if (config.emailSmtpHost) setEmailSmtpHost(config.emailSmtpHost);
  }, [
    config.whatsAppPhone,
    config.openWaServerUrl,
    config.openWaSessionId,
    config.openWaApiKey,
    config.msTeamsWebhookUrl,
    config.emailRecipients,
    config.emailSender,
    config.emailSmtpHost,
  ]);

  // Test WhatsApp
  const handleTestWhatsAppDispatch = async () => {
    if (!waPhone.trim()) {
      setWaTestResponse({
        success: false,
        detail: 'Please enter your company WhatsApp phone number or Group JID first.',
      });
      return;
    }

    setIsSendingWaTest(true);
    setWaTestResponse(null);

    try {
      await onSaveWhatsAppConfig({
        whatsAppPhone: waPhone.trim(),
        openWaServerUrl: openWaServerUrl.trim(),
        openWaSessionId: openWaSessionId.trim(),
        openWaApiKey: openWaApiKey.trim(),
        autoDispatchWhatsApp: waAutoDispatch,
        whatsAppEnabled: true,
      });

      const res = await onTestWhatsApp(
        waPhone.trim(),
        config.whatsAppCallMeBotApiKey || '',
        config.whatsAppCustomWebhookUrl || '',
        'OPENWA',
        {
          serverUrl: openWaServerUrl.trim(),
          sessionId: openWaSessionId.trim(),
          apiKey: openWaApiKey.trim(),
          chatId: waPhone.trim(),
        }
      );

      setWaTestResponse({
        success: res.receipt.dispatched,
        detail: res.receipt.responseDetail || 'WhatsApp alert dispatched to company line.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setWaTestResponse({
        success: false,
        detail: `WhatsApp error: ${msg}`,
      });
    } finally {
      setIsSendingWaTest(false);
    }
  };

  // Test MS Teams
  const handleTestTeamsDispatch = async () => {
    const trimmed = teamsWebhook.trim();
    if (!trimmed) {
      setTeamsTestResponse({
        success: false,
        detail: 'Please paste your MS Teams Webhook URL first.',
      });
      return;
    }

    setIsSendingTeamsTest(true);
    setTeamsTestResponse(null);

    try {
      localStorage.setItem('skyalert_teams_webhook', trimmed);
      await onSaveWebhookUrl(trimmed);
      const res = await onTestWelcomeMessage(trimmed);
      setTeamsTestResponse(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTeamsTestResponse({
        success: false,
        detail: `Teams connection error: ${msg}`,
      });
    } finally {
      setIsSendingTeamsTest(false);
    }
  };

  // Test Email
  const handleTestEmailDispatch = async () => {
    if (!emailRecipients.trim()) {
      setEmailTestResponse({
        success: false,
        detail: 'Please enter at least one company recipient email address.',
      });
      return;
    }

    setIsSendingEmailTest(true);
    setEmailTestResponse(null);

    try {
      const patch = {
        emailRecipients: emailRecipients.trim(),
        emailSender: emailSender.trim(),
        emailSmtpHost: emailSmtpHost.trim(),
        autoDispatchEmail: emailAutoDispatch,
        emailEnabled: true,
      };

      if (onSaveEmailConfig) {
        await onSaveEmailConfig(patch);
      }

      if (onTestEmail) {
        const res = await onTestEmail(
          emailRecipients.trim(),
          emailSender.trim(),
          emailSmtpHost.trim()
        );
        setEmailTestResponse({
          success: res.receipt.dispatched,
          detail: res.receipt.responseDetail || 'Email alert dispatched to company line.',
        });
      } else {
        const res = await fetch('/api/system/test-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailRecipients: emailRecipients.trim(),
            emailSender: emailSender.trim(),
            emailSmtpHost: emailSmtpHost.trim(),
            itemId: latestItem?.id,
          }),
        });
        const data = await res.json();
        setEmailTestResponse({
          success: data.receipt?.dispatched ?? true,
          detail: data.receipt?.responseDetail || 'Test alert pushed to company email line.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEmailTestResponse({
        success: false,
        detail: `Email dispatch error: ${msg}`,
      });
    } finally {
      setIsSendingEmailTest(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 md:p-7 space-y-6">
      {/* Top Header & Dedup Assurance Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
            <span>Company Data-Protected Communication Lines</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              End-to-End Isolated
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
            Broadcast Channels & Operational Lines
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Strictly limited to WhatsApp, MS Teams, and Email company lines. Every incident is fingerprint-tracked: alerts with unchanged severity are suppressed to eliminate repetitive channel noise.
          </p>
        </div>

        {/* 3-Line Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveLine('WHATSAPP')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-all ${
              activeLine === 'WHATSAPP'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
            {config.whatsAppPhone && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveLine('TEAMS')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-all ${
              activeLine === 'TEAMS'
                ? 'bg-[#5059C9]/20 text-[#9da5ff] border border-[#5059C9]/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-[#5059C9]" />
            <span>MS Teams</span>
            {config.msTeamsWebhookUrl && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#5059C9]" />
            )}
          </button>

          <button
            onClick={() => setActiveLine('EMAIL')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition-all ${
              activeLine === 'EMAIL'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>Email Line</span>
            {config.emailRecipients && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            )}
          </button>
        </div>
      </div>

      {/* LINE 1: WHATSAPP */}
      {activeLine === 'WHATSAPP' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: WhatsApp Settings */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company WhatsApp Number / Group JID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="e.g. +14155552671 or 1203630248@g.us"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-colors"
                  />
                  {waPhone.trim() && (
                    <div className="absolute right-3 top-2.5 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Check className="w-3.5 h-3.5" /> Armed
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Alerts are automatically pushed immediately upon ingestion whenever an incident qualifies as Medium, High, or Critical.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    OpenWA Server Endpoint
                  </label>
                  <input
                    type="text"
                    value={openWaServerUrl}
                    onChange={(e) => setOpenWaServerUrl(e.target.value)}
                    placeholder="http://localhost:2785"
                    className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    OpenWA Session Identifier
                  </label>
                  <input
                    type="text"
                    value={openWaSessionId}
                    onChange={(e) => setOpenWaSessionId(e.target.value)}
                    placeholder="default"
                    className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Automatic Push Toggle & Test Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={waAutoDispatch}
                    onChange={(e) => {
                      setWaAutoDispatch(e.target.checked);
                      onSaveWhatsAppConfig({ autoDispatchWhatsApp: e.target.checked });
                    }}
                    className="rounded bg-black/40 border-white/[0.2] text-emerald-500 focus:ring-0"
                  />
                  <span>Auto-Push Medium & High Flight Delays Instantly</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestWhatsAppDispatch}
                    disabled={isSendingWaTest || !waPhone.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/40"
                  >
                    {isSendingWaTest ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Test WhatsApp Line</span>
                  </button>
                </div>
              </div>

              {waTestResponse && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    waTestResponse.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/40 border-red-500/40 text-red-200'
                  }`}
                >
                  {waTestResponse.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">
                      {waTestResponse.success ? 'WhatsApp Line Verified' : 'WhatsApp Delivery Notice'}:
                    </span>{' '}
                    <span>{waTestResponse.detail}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live Card Preview */}
            <div className="lg:col-span-5 bg-black/30 border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.06] pb-2 mb-3">
                  <span className="font-medium text-slate-300">WhatsApp Payload Format</span>
                  <span className="font-mono text-[11px] text-emerald-400">Direct & OpenWA</span>
                </div>
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-100 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {latestItem ? formatWhatsAppNotification(latestItem).slice(0, 320) + '...' : 'No incident loaded.'}
                </div>
              </div>

              {latestItem && (
                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Direct Web Link:</span>
                  <a
                    href={buildWhatsAppShareUrl(waPhone, latestItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    Open WhatsApp Web <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LINE 2: MICROSOFT TEAMS */}
      {activeLine === 'TEAMS' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Microsoft Teams Incoming Webhook or Power Automate URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={teamsWebhook}
                    onChange={(e) => setTeamsWebhook(e.target.value)}
                    placeholder="https://company.webhook.office.com/webhookb2/..."
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5059C9]/60 focus:ring-1 focus:ring-[#5059C9]/60 transition-colors"
                  />
                  {teamsWebhook.trim() && (
                    <div className="absolute right-3 top-2.5 text-[11px] text-[#9da5ff] flex items-center gap-1 font-mono">
                      <Check className="w-3.5 h-3.5" /> Armed
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Connect to your operations crisis channel. Dispatches rich MessageCards with flight volume, delay metrics, and NOTAM advisories.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={teamsAutoDispatch}
                    onChange={(e) => {
                      setTeamsAutoDispatch(e.target.checked);
                      onSaveWebhookUrl(teamsWebhook.trim());
                    }}
                    className="rounded bg-black/40 border-white/[0.2] text-[#5059C9] focus:ring-0"
                  />
                  <span>Auto-Dispatch Qualifying Alerts to Teams Channel</span>
                </label>

                <button
                  onClick={handleTestTeamsDispatch}
                  disabled={isSendingTeamsTest || !teamsWebhook.trim()}
                  className="px-4 py-2 bg-[#5059C9] hover:bg-[#434bb5] disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-950/40"
                >
                  {isSendingTeamsTest ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send Test Card to Channel</span>
                </button>
              </div>

              {teamsTestResponse && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    teamsTestResponse.success
                      ? 'bg-indigo-950/40 border-[#5059C9]/40 text-indigo-200'
                      : 'bg-red-950/40 border-red-500/40 text-red-200'
                  }`}
                >
                  {teamsTestResponse.success ? (
                    <CheckCircle2 className="w-4 h-4 text-[#9da5ff] shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">
                      {teamsTestResponse.success ? 'Teams Channel Linked' : 'Teams Delivery Notice'}:
                    </span>{' '}
                    <span>{teamsTestResponse.detail}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-black/30 border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.06] pb-2 mb-3">
                  <span className="font-medium text-slate-300">Teams MessageCard Format</span>
                  <span className="font-mono text-[11px] text-[#9da5ff]">Webhook Payload</span>
                </div>
                <div className="bg-indigo-950/20 border border-[#5059C9]/30 rounded-xl p-3 text-xs text-indigo-100 font-mono space-y-2 max-h-48 overflow-y-auto">
                  <div className="text-[#9da5ff] font-bold">
                    {latestItem ? `[${latestItem.severity}] ${latestItem.headline}` : 'No active incident'}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Delayed Flights: ~{latestItem?.estimatedDelayedFlights?.toLocaleString()} · Average Delay: +{latestItem?.avgDelayMinutes} mins
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Directive: {latestItem?.recommendedAction || 'Monitor ATC flow restrictions.'}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] text-slate-400">
                <span>Filter Rule: Only Medium, High, and Critical alerts are dispatched. Low noise strictly filtered.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LINE 3: EMAIL */}
      {activeLine === 'EMAIL' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Company Emergency Operations Email Recipients
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    placeholder="ops-crisis@company-lines.aero, duty-manager@company-lines.aero"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/60 transition-colors"
                  />
                  {emailRecipients.trim() && (
                    <div className="absolute right-3 top-2.5 text-[11px] text-sky-400 flex items-center gap-1 font-mono">
                      <Check className="w-3.5 h-3.5" /> Armed
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Comma-separated internal distribution list for flight dispatch desks and crisis management.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Daemon Sender Address
                  </label>
                  <input
                    type="text"
                    value={emailSender}
                    onChange={(e) => setEmailSender(e.target.value)}
                    placeholder="skyalert-daemon@aviation-relay.aero"
                    className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Internal SMTP Relay Server
                  </label>
                  <input
                    type="text"
                    value={emailSmtpHost}
                    onChange={(e) => setEmailSmtpHost(e.target.value)}
                    placeholder="smtp.company-lines.internal:587"
                    className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={emailAutoDispatch}
                    onChange={(e) => {
                      setEmailAutoDispatch(e.target.checked);
                      if (onSaveEmailConfig) onSaveEmailConfig({ autoDispatchEmail: e.target.checked });
                    }}
                    className="rounded bg-black/40 border-white/[0.2] text-sky-500 focus:ring-0"
                  />
                  <span>Auto-Dispatch High & Critical Flight Delays to Email</span>
                </label>

                <button
                  onClick={handleTestEmailDispatch}
                  disabled={isSendingEmailTest || !emailRecipients.trim()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-sky-950/40"
                >
                  {isSendingEmailTest ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  <span>Test Email Line</span>
                </button>
              </div>

              {emailTestResponse && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    emailTestResponse.success
                      ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                      : 'bg-red-950/40 border-red-500/40 text-red-200'
                  }`}
                >
                  {emailTestResponse.success ? (
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">
                      {emailTestResponse.success ? 'Email Line Verified' : 'Email Delivery Notice'}:
                    </span>{' '}
                    <span>{emailTestResponse.detail}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-black/30 border border-white/[0.06] rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/[0.06] pb-2 mb-3">
                  <span className="font-medium text-slate-300">Executive Email Briefing</span>
                  <span className="font-mono text-[11px] text-sky-400">HTML & Text Relay</span>
                </div>
                <div className="bg-sky-950/20 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-100 font-mono space-y-2 max-h-48 overflow-y-auto">
                  <div className="text-white font-bold">
                    Subject: [SkyAlert {latestItem?.severity || 'ALERT'}] {latestItem?.headline || 'Flight Disruption Wire'}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    To: {emailRecipients}
                  </div>
                  <div className="text-[11px] text-slate-400 whitespace-pre-wrap">
                    {latestItem ? formatEmailNotification(latestItem).plainText.slice(0, 220) + '...' : 'No incident loaded.'}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] text-slate-400">
                <span>Enterprise isolation: Alerts routed strictly through internal mail servers without third-party analytics.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
