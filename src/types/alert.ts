export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DisasterCategory =
  | 'VOLCANIC_ASH'
  | 'GEOPOLITICAL_AIRSPACE'
  | 'EXTREME_WEATHER'
  | 'INFRASTRUCTURE_OUTAGE'
  | 'SPACE_WEATHER'
  | 'SEISMIC_TSUNAMI'
  | 'ROUTINE_NOISE';

export interface TeamsDispatchReceipt {
  dispatched: boolean;
  timestamp?: string;
  httpStatus?: number;
  responseDetail?: string;
  payloadSize?: number;
}

export interface WhatsAppDispatchReceipt {
  dispatched: boolean;
  timestamp?: string;
  method?: 'CLICK_TO_CHAT' | 'OPENWA' | 'CALLMEBOT' | 'WEBHOOK' | 'DIRECT_RELAY';
  targetPhone?: string;
  responseDetail?: string;
  clickToChatUrl?: string;
}

export interface EmailDispatchReceipt {
  dispatched: boolean;
  timestamp?: string;
  recipientCount?: number;
  recipients?: string[];
  responseDetail?: string;
  subject?: string;
}

export interface IngestedNewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceCategory: 'NEWS_WIRE' | 'NOTAM' | 'VOLCANO_VAAC' | 'METEOROLOGY' | 'INFRASTRUCTURE' | 'EARTHQUAKE_SEISMIC' | 'IATA_AIRLINE_OPS';
  publishedAt: string;
  ingestedAt: string;
  // Alert Tracking & Deduplication
  incidentFingerprint: string;
  severity: AlertSeverity;
  previousSeverity?: AlertSeverity;
  hasSeverityChanged: boolean;
  isDuplicateDropped: boolean;
  // Filter evaluation results
  evaluated: boolean;
  priorityScore: number; // 0 - 100
  isFilteredOut: boolean; // true if LOW severity / rejected as noise
  filterReason: string;
  // Aviation disruption metadata (computed by filter)
  estimatedDelayedFlights: number;
  estimatedCancelledFlights: number;
  avgDelayMinutes: number;
  impactedAirports: string[];
  impactedFIRs: string[];
  primaryCorridors: string[];
  recommendedAction?: string;
  notamCode?: string;
  // 3 Company Data-Protected Lines:
  teamsDispatch: TeamsDispatchReceipt;
  whatsAppDispatch?: WhatsAppDispatchReceipt;
  emailDispatch?: EmailDispatchReceipt;
}

export interface SystemDaemonConfig {
  // Line 1: Microsoft Teams Protected Line
  teamsEnabled: boolean;
  msTeamsWebhookUrl: string;

  // Line 2: WhatsApp Protected Line
  whatsAppEnabled: boolean;
  whatsAppPhone: string; // e.g. +14155552671
  openWaServerUrl: string; // e.g. http://localhost:2785
  openWaSessionId: string; // e.g. default
  openWaApiKey: string; // optional X-API-Key
  openWaChatId: string; // target chat/group JID
  whatsAppCallMeBotApiKey: string;
  whatsAppMethod?: 'CLICK_TO_CHAT' | 'OPENWA' | 'CALLMEBOT' | 'WEBHOOK' | 'DIRECT_RELAY';
  whatsAppCustomWebhookUrl?: string;
  autoDispatchWhatsApp: boolean;

  // Line 3: Email Protected Line
  emailEnabled: boolean;
  emailRecipients: string; // comma-separated emails, e.g. "dispatch@airline.aero, ops@airline.aero"
  emailSender: string; // sender display e.g. "SkyAlert Emergency Flight Ops <alerts@airline.aero>"
  emailSmtpHost: string; // optional custom SMTP relay
  autoDispatchEmail: boolean;

  // Global Pipeline & Deduplication Controls
  systemArmed: boolean;
  pollingIntervalSeconds: number;
  minSeverity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  minFlightImpact: number;
  soundAlertEnabled: boolean;
  autoDispatchTeams: boolean;
  dedupEnabled: boolean; // Track alerts: notify ONLY if severity changes
}

export interface SystemDaemonStats {
  daemonStatus: 'RUNNING' | 'IDLE' | 'PAUSED';
  uptimeSeconds: number;
  totalNewsIngested: number;
  passedToTeamsCount: number;
  droppedNoiseCount: number;
  droppedDuplicateCount: number; // Alerts tracked where severity did not change
  criticalPushed: number;
  highPushed: number;
  mediumPushed: number;
  teamsDispatches: number;
  whatsAppDispatches: number;
  emailDispatches: number;
  lastIngestedTimestamp?: string;
  lastTeamsDispatchTimestamp?: string;
  lastTeamsDispatchStatus?: string;
  lastWhatsAppDispatchTimestamp?: string;
  lastWhatsAppDispatchStatus?: string;
  lastEmailDispatchTimestamp?: string;
  lastEmailDispatchStatus?: string;
}
