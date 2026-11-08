import React, { useState, useEffect } from 'react';
import { IngestedNewsItem, SystemDaemonConfig, SystemDaemonStats } from './types/alert';
import { SystemHeader } from './components/SystemHeader';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { NewsStreamView } from './components/NewsStreamView';
import { TeamsChannelConfigModal } from './components/TeamsChannelConfigModal';
import { TeamsCardPreviewModal } from './components/TeamsCardPreviewModal';
import { IngestNewsModal } from './components/IngestNewsModal';
import { TeamsConnectionBanner } from './components/TeamsConnectionBanner';
import { soundEngine } from './utils/audioAlert';
import { Radio, AlertTriangle, ShieldCheck, Terminal, Send } from 'lucide-react';

export default function App() {
  const [newsItems, setNewsItems] = useState<IngestedNewsItem[]>([]);
  const [config, setConfig] = useState<SystemDaemonConfig>({
    teamsEnabled: true,
    msTeamsWebhookUrl: '',
    autoDispatchTeams: true,
    whatsAppEnabled: true,
    whatsAppMethod: 'OPENWA',
    whatsAppPhone: '',
    whatsAppCallMeBotApiKey: '',
    whatsAppCustomWebhookUrl: '',
    openWaServerUrl: 'http://localhost:2785',
    openWaSessionId: 'default',
    openWaApiKey: '',
    openWaChatId: '',
    autoDispatchWhatsApp: true,
    emailEnabled: true,
    emailRecipients: 'ops-crisis@company-lines.aero',
    emailSender: 'skyalert-daemon@aviation-relay.aero',
    emailSmtpHost: 'smtp.company-lines.internal:587',
    autoDispatchEmail: true,
    systemArmed: true,
    pollingIntervalSeconds: 20,
    minSeverity: 'MEDIUM',
    minFlightImpact: 40,
    soundAlertEnabled: true,
    dedupEnabled: true,
  });

  const [stats, setStats] = useState<SystemDaemonStats>({
    daemonStatus: 'RUNNING',
    uptimeSeconds: 0,
    totalNewsIngested: 0,
    passedToTeamsCount: 0,
    droppedNoiseCount: 0,
    droppedDuplicateCount: 0,
    criticalPushed: 0,
    highPushed: 0,
    mediumPushed: 0,
    teamsDispatches: 0,
    whatsAppDispatches: 0,
    emailDispatches: 0,
  });

  const [selectedItem, setSelectedItem] = useState<IngestedNewsItem | null>(null);
  const [previewItem, setPreviewItem] = useState<IngestedNewsItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [isDispatchingWhatsApp, setIsDispatchingWhatsApp] = useState<string | null>(null);
  const [isDispatchingEmail, setIsDispatchingEmail] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  // Live Toast for new MS Teams dispatches
  const [activeToast, setActiveToast] = useState<{
    title: string;
    headline: string;
    severity: string;
    isNoise: boolean;
  } | null>(null);

  // Connect to SSE stream for live updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/stream');

        eventSource.addEventListener('INIT', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.newsItems) setNewsItems(data.newsItems);
            if (data.config) setConfig(data.config);
            if (data.stats) setStats(data.stats);
            if (data.newsItems?.length > 0 && !selectedItem) {
              setSelectedItem(data.newsItems[0]);
            }
          } catch (e) {
            console.error('Error parsing SSE INIT:', e);
          }
        });

        eventSource.addEventListener('NEW_ITEM', (event) => {
          try {
            const data = JSON.parse(event.data);
            const newItem: IngestedNewsItem = data.item;

            setNewsItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
            if (data.stats) setStats(data.stats);

            // Play audio alert
            if (config.soundAlertEnabled) {
              if (newItem.isFilteredOut) {
                soundEngine.playNoiseFilteredSound();
              } else if (newItem.severity === 'CRITICAL') {
                soundEngine.playCriticalAlert();
              } else if (newItem.severity === 'HIGH') {
                soundEngine.playHighAlert();
              } else if (newItem.severity === 'MEDIUM') {
                soundEngine.playMediumAlert();
              }
            }

            // Show real-time system toast
            setActiveToast({
              title: newItem.isDuplicateDropped
                ? 'Incident Tracked · Duplicate Suppressed'
                : newItem.isFilteredOut
                ? 'Noise Filter Intercepted & Blocked'
                : `🚨 [${newItem.severity}] Pushed to Protected Lines`,
              headline: newItem.headline,
              severity: newItem.severity,
              isNoise: newItem.isFilteredOut || newItem.isDuplicateDropped,
            });

            setTimeout(() => {
              setActiveToast(null);
            }, 5000);
          } catch (e) {
            console.error('Error parsing SSE NEW_ITEM:', e);
          }
        });

        eventSource.addEventListener('ITEM_UPDATED', (event) => {
          try {
            const data = JSON.parse(event.data);
            const updated: IngestedNewsItem = data.item;
            setNewsItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            if (data.stats) setStats(data.stats);
          } catch (e) {
            console.error('Error parsing SSE ITEM_UPDATED:', e);
          }
        });

        eventSource.addEventListener('CONFIG_UPDATED', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.config) setConfig(data.config);
            if (data.stats) setStats(data.stats);
          } catch (e) {
            console.error('Error parsing CONFIG_UPDATED:', e);
          }
        });

        eventSource.addEventListener('RESET', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.newsItems) setNewsItems(data.newsItems);
            if (data.stats) setStats(data.stats);
          } catch (e) {
            console.error('Error parsing RESET:', e);
          }
        });

        eventSource.onerror = () => {
          if (!pollInterval) {
            pollInterval = setInterval(fetchSystemManually, 5000);
          }
        };
      } catch (err) {
        console.warn('SSE failed, polling fallback:', err);
        pollInterval = setInterval(fetchSystemManually, 5000);
      }
    };

    const fetchSystemManually = async () => {
      try {
        const res = await fetch('/api/system');
        if (res.ok) {
          const data = await res.json();
          setNewsItems(data.newsItems);
          setConfig(data.config);
          setStats(data.stats);
        }
      } catch (e) {
        console.warn('Manual polling error:', e);
      }
    };

    setupSSE();
    fetchSystemManually();

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [config.soundAlertEnabled]);

  // Actions
  const handleToggleArmed = async () => {
    const nextArmed = !config.systemArmed;
    const res = await fetch('/api/system/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemArmed: nextArmed }),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data.config);
      setStats(data.stats);
    }
  };

  const handleTriggerPoll = async () => {
    setIsPolling(true);
    try {
      const res = await fetch('/api/system/trigger-poll', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSelectedItem(data.item);
      }
    } finally {
      setIsPolling(false);
    }
  };

  const handleFetchLiveFeeds = async () => {
    setIsFetchingLive(true);
    try {
      const res = await fetch('/api/system/fetch-live-feeds', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setSelectedItem(data.items[0]);
        }
        setActiveToast({
          title: `Live Feeds Checked · ${data.newItemsCount || 0} Incident(s) Ingested`,
          headline: 'USGS Japan Seismology, FAA NAS Status & IATA Operations checked.',
          severity: 'HIGH',
          isNoise: false,
        });
        setTimeout(() => setActiveToast(null), 4000);
      }
    } catch (err) {
      console.error('Error fetching live feeds:', err);
    } finally {
      setIsFetchingLive(false);
    }
  };

  const handleSaveConfig = async (newConfig: SystemDaemonConfig) => {
    const res = await fetch('/api/system/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    if (res.ok) {
      const data = await res.json();
      setConfig(data.config);
      setStats(data.stats);
    }
  };

  const handleTestTeamsWebhook = async (webhookUrl: string) => {
    const res = await fetch('/api/system/test-teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, itemId: selectedItem?.id || newsItems[0]?.id }),
    });
    return await res.json();
  };

  const handleIngestNews = async (
    headline: string,
    summary: string,
    source: string,
    category: IngestedNewsItem['sourceCategory']
  ) => {
    const res = await fetch('/api/system/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline, summary, source, category }),
    });
    const data = await res.json();
    if (data.item) {
      setSelectedItem(data.item);
    }
    return data.item;
  };

  const handleDispatchToTeams = async (itemId: string) => {
    setIsDispatching(itemId);
    try {
      const res = await fetch('/api/system/dispatch-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.item) {
        setNewsItems((prev) => prev.map((i) => (i.id === itemId ? data.item : i)));
        if (data.stats) setStats(data.stats);
      }
    } finally {
      setIsDispatching(null);
    }
  };

  const handleSaveWebhookUrl = async (url: string) => {
    localStorage.setItem('skyalert_teams_webhook', url);
    await handleSaveConfig({ ...config, msTeamsWebhookUrl: url });
  };

  const handleTestWelcomeMessage = async (webhookUrl: string) => {
    const res = await fetch('/api/system/test-teams-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl }),
    });
    const data = await res.json();
    return {
      success: !!data.success,
      detail: data.detail || (data.success ? 'Welcome alert posted to your MS Teams channel!' : 'Failed to connect to Teams'),
    };
  };

  const handleSaveWhatsAppConfig = async (patch: Partial<SystemDaemonConfig>) => {
    const updated = { ...config, ...patch };
    await handleSaveConfig(updated);
  };

  const handleTestWhatsApp = async (
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
  ) => {
    const targetItem = selectedItem || newsItems[0];
    const res = await fetch('/api/system/test-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        apiKey,
        webhookUrl,
        method,
        itemId: targetItem?.id,
        openWaServerUrl: openWaParams?.serverUrl,
        openWaSessionId: openWaParams?.sessionId,
        openWaApiKey: openWaParams?.apiKey,
        openWaChatId: openWaParams?.chatId,
      }),
    });
    const data = await res.json();
    return {
      receipt: data.receipt || {
        dispatched: !!data.success,
        responseDetail: data.detail || (data.success ? 'WhatsApp message dispatched.' : 'WhatsApp test completed.'),
      },
    };
  };

  const handleDispatchToWhatsApp = async (itemId: string) => {
    setIsDispatchingWhatsApp(itemId);
    try {
      const res = await fetch('/api/system/dispatch-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.item) {
        setNewsItems((prev) => prev.map((i) => (i.id === itemId ? data.item : i)));
        if (data.stats) setStats(data.stats);
      }
    } finally {
      setIsDispatchingWhatsApp(null);
    }
  };

  const handleSaveEmailConfig = async (patch: Partial<SystemDaemonConfig>) => {
    const updated = { ...config, ...patch };
    await handleSaveConfig(updated);
  };

  const handleTestEmail = async (recipients: string, sender?: string, smtpHost?: string) => {
    const targetItem = selectedItem || newsItems[0];
    const res = await fetch('/api/system/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailRecipients: recipients,
        emailSender: sender,
        emailSmtpHost: smtpHost,
        itemId: targetItem?.id,
      }),
    });
    const data = await res.json();
    return {
      receipt: data.receipt || {
        dispatched: !!data.success,
        responseDetail: data.detail || 'Email test completed.',
      },
    };
  };

  const handleDispatchToEmail = async (itemId: string) => {
    setIsDispatchingEmail(itemId);
    try {
      const res = await fetch('/api/system/dispatch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.item) {
        setNewsItems((prev) => prev.map((i) => (i.id === itemId ? data.item : i)));
        if (data.stats) setStats(data.stats);
      }
    } finally {
      setIsDispatchingEmail(null);
    }
  };

  const handleResetSystem = async () => {
    await fetch('/api/system/reset', { method: 'POST' });
  };

  return (
    <div className="min-h-screen bg-[#07080d] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.14),rgba(255,255,255,0))] text-slate-100 flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* System Daemon Header */}
      <SystemHeader
        config={config}
        stats={stats}
        isPolling={isPolling}
        isFetchingLive={isFetchingLive}
        onToggleArmed={handleToggleArmed}
        onTriggerPoll={handleTriggerPoll}
        onFetchLiveFeeds={handleFetchLiveFeeds}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        onResetSystem={handleResetSystem}
      />

      {/* Real-Time Toast Notification */}
      {activeToast && (
        <div className="fixed top-16 right-4 z-50 max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
          <div
            className={`rounded-2xl border p-4 shadow-2xl backdrop-blur-2xl text-xs flex items-start gap-3 ${
              activeToast.isNoise
                ? 'bg-slate-900/90 border-white/[0.1] text-slate-300'
                : activeToast.severity === 'CRITICAL'
                ? 'bg-red-950/90 border-red-500/50 text-white'
                : 'bg-indigo-950/90 border-[#5059C9]/50 text-white'
            }`}
          >
            <div className="p-2 rounded-xl bg-black/40">
              {activeToast.isNoise ? (
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              ) : (
                <Send className="w-4 h-4 text-emerald-400 animate-pulse" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold mb-0.5">
                {activeToast.title}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                {activeToast.headline}
              </p>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* System Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Company Data-Protected Communication Lines Hub */}
        <TeamsConnectionBanner
          config={config}
          latestItem={selectedItem || newsItems[0]}
          onSaveWebhookUrl={handleSaveWebhookUrl}
          onTestWelcomeMessage={handleTestWelcomeMessage}
          onSaveWhatsAppConfig={handleSaveWhatsAppConfig}
          onTestWhatsApp={handleTestWhatsApp}
          onSaveEmailConfig={handleSaveEmailConfig}
          onTestEmail={handleTestEmail}
        />

        {/* 3-Stage Pipeline Diagram with Deduplication Tracking */}
        <PipelineVisualizer stats={stats} config={config} />

        {/* Real-time Ingestion & Multi-Channel Outbox Stream */}
        <NewsStreamView
          newsItems={newsItems}
          config={config}
          selectedItem={selectedItem}
          onSelectItem={(item) => setSelectedItem(item)}
          onOpenTeamsPreview={(item) => setPreviewItem(item)}
          onDispatchToTeams={handleDispatchToTeams}
          onDispatchToWhatsApp={handleDispatchToWhatsApp}
          onDispatchToEmail={handleDispatchToEmail}
          isDispatching={isDispatching}
          isDispatchingWhatsApp={isDispatchingWhatsApp}
          isDispatchingEmail={isDispatchingEmail}
        />
      </main>

      {/* Modals */}
      <TeamsChannelConfigModal
        config={config}
        sampleItem={selectedItem || newsItems[0]}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaveConfig={handleSaveConfig}
        onTestTeamsWebhook={handleTestTeamsWebhook}
      />

      <TeamsCardPreviewModal
        item={previewItem}
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        onDispatchToTeams={handleDispatchToTeams}
        isDispatching={isDispatching === previewItem?.id}
      />

      <IngestNewsModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestNews={handleIngestNews}
      />
    </div>
  );
}
