import { IngestedNewsItem } from '../types/alert';

/**
 * Builds standard Microsoft Teams Office 365 Connector card (MessageCard).
 * Supported universally by all incoming webhooks without complex schemas.
 */
export function buildTeamsMessageCard(item: IngestedNewsItem) {
  const isCritical = item.severity === 'CRITICAL';
  const isHigh = item.severity === 'HIGH';
  const themeColor = isCritical ? 'D83B01' : isHigh ? 'FF8C00' : '0078D4';
  const statusEmoji = isCritical ? '🚨' : isHigh ? '⚠️' : '⚡';

  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: themeColor,
    summary: `${statusEmoji} [${item.severity}] Flight Disruption: ${item.headline}`,
    sections: [
      {
        activityTitle: `${statusEmoji} [${item.severity} DISRUPTION] ${item.headline}`,
        activitySubtitle: `Source: ${item.source} (${item.sourceCategory}) • Priority Score: ${item.priorityScore}/100 • ${new Date(item.ingestedAt).toUTCString()}`,
        text: item.summary,
        facts: [
          { name: 'Disaster Category', value: item.sourceCategory.replace(/_/g, ' ') },
          { name: 'Estimated Delayed Flights', value: `${item.estimatedDelayedFlights.toLocaleString()} flights` },
          { name: 'Estimated Cancellations', value: `${item.estimatedCancelledFlights.toLocaleString()} flights` },
          { name: 'Average Delay Ripple', value: `+${item.avgDelayMinutes} mins (~${(item.avgDelayMinutes / 60).toFixed(1)} hrs)` },
          { name: 'Impacted Hubs', value: item.impactedAirports.join(', ') || 'Global routing' },
          { name: 'Impacted FIRs / Corridors', value: (item.impactedFIRs.concat(item.primaryCorridors)).join(' | ') || 'Transcontinental' },
          { name: 'NOTAM / Bulletin Ref', value: item.notamCode || 'URGENT-NOTAM-ADVISORY' },
          { name: 'Command Directive', value: item.recommendedAction || 'Monitor ATC flow restrictions and notify dispatch desk.' },
        ],
        markdown: true,
      },
    ],
    potentialAction: [
      {
        '@type': 'OpenURIAction',
        name: 'Acknowledge in SkyAlert System',
        targets: [
          {
            os: 'default',
            uri: typeof window !== 'undefined' ? window.location.origin : 'https://skyalert.internal',
          },
        ],
      },
    ],
  };
}

/**
 * Formats an IngestedNewsItem into an MS Teams Adaptive Card payload (schema 1.4)
 * For Power Automate Workflows.
 */
export function buildTeamsAdaptiveCard(item: IngestedNewsItem) {
  const isCritical = item.severity === 'CRITICAL';
  const isHigh = item.severity === 'HIGH';
  const severityColor = isCritical ? 'Attention' : isHigh ? 'Warning' : 'Accent';
  const statusEmoji = isCritical ? '🚨' : isHigh ? '⚠️' : '⚡';

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'Container',
              style: isCritical ? 'attention' : 'default',
              bleed: true,
              items: [
                {
                  type: 'ColumnSet',
                  columns: [
                    {
                      type: 'Column',
                      width: 'auto',
                      items: [
                        {
                          type: 'TextBlock',
                          text: `${statusEmoji} [${item.severity} GLOBAL FLIGHT DISRUPTION]`,
                          weight: 'Bolder',
                          size: 'Medium',
                          color: severityColor,
                        },
                      ],
                    },
                    {
                      type: 'Column',
                      width: 'stretch',
                      items: [
                        {
                          type: 'TextBlock',
                          text: `Priority: ${item.priorityScore}/100`,
                          horizontalAlignment: 'Right',
                          isSubtle: true,
                          size: 'Small',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'TextBlock',
                  text: item.headline,
                  weight: 'Bolder',
                  size: 'Large',
                  wrap: true,
                },
                {
                  type: 'TextBlock',
                  text: `Wire: ${item.source} • ${new Date(item.ingestedAt).toUTCString()}`,
                  isSubtle: true,
                  size: 'Small',
                },
              ],
            },
            {
              type: 'TextBlock',
              text: item.summary,
              wrap: true,
              spacing: 'Medium',
            },
            {
              type: 'FactSet',
              spacing: 'Medium',
              facts: [
                { title: 'Delayed Flights:', value: `${item.estimatedDelayedFlights.toLocaleString()} flights` },
                { title: 'Cancellations:', value: `${item.estimatedCancelledFlights.toLocaleString()} flights` },
                { title: 'Average Delay:', value: `+${item.avgDelayMinutes} mins (~${(item.avgDelayMinutes / 60).toFixed(1)} hrs)` },
                { title: 'Impacted Hubs:', value: item.impactedAirports.join(', ') || 'Global' },
                { title: 'Airspace & FIRs:', value: item.impactedFIRs.join(', ') || 'Multi-region' },
                { title: 'Key Corridors:', value: item.primaryCorridors.join(' | ') || 'Major tracks' },
                { title: 'NOTAM Reference:', value: item.notamCode || 'URGENT-NOTAM-ADVISORY' },
              ],
            },
            {
              type: 'Container',
              style: 'emphasis',
              items: [
                {
                  type: 'TextBlock',
                  text: `Directive: ${item.recommendedAction || 'Execute contingency reroutes and notify station managers.'}`,
                  wrap: true,
                  weight: 'Bolder',
                  size: 'Small',
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

/**
 * Formats a clean, high-priority notification message for Microsoft Teams
 */
export function formatTeamsPlainNotification(item: IngestedNewsItem): string {
  const emoji = item.severity === 'CRITICAL' ? '🚨 [CRITICAL FLIGHT DISRUPTION]' : item.severity === 'HIGH' ? '⚠️ [HIGH FLIGHT DELAY]' : '⚡ [MEDIUM FLIGHT DISRUPTION]';

  return (
`${emoji}
*${item.headline}*

📍 Source: ${item.source} (${item.sourceCategory})
🕒 UTC: ${new Date(item.ingestedAt).toUTCString()}
📊 Priority Score: ${item.priorityScore}/100

*DISRUPTION IMPACT:*
• ✈️ Delayed Flights: ~${item.estimatedDelayedFlights.toLocaleString()}
• ❌ Cancellations: ~${item.estimatedCancelledFlights.toLocaleString()}
• ⏳ Average Delay: +${item.avgDelayMinutes} mins (~${(item.avgDelayMinutes / 60).toFixed(1)} hrs)
• 🗺️ Impacted Hubs: ${item.impactedAirports.join(', ')}
• 📡 Airspace & FIRs: ${item.impactedFIRs.join(', ')}
• 🌐 Corridors: ${item.primaryCorridors.join(' | ')}

📋 DIRECTIVE:
${item.recommendedAction || 'Monitor ATC flow restrictions and notify station dispatch.'}

🔖 NOTAM: ${item.notamCode || 'ICAO-OPS-URGENT'}
_SkyAlert Automated News Ingestion Pipeline_`
  );
}

/**
 * Generates an official Microsoft Teams web share URL.
 * Allows ANY user to post this message directly into ANY MS Teams group or channel
 * in 1 click without needing admin webhook privileges!
 */
export function buildTeamsShareUrl(item: IngestedNewsItem): string {
  const message = formatTeamsPlainNotification(item);
  return `https://teams.microsoft.com/share?msgText=${encodeURIComponent(message)}`;
}

/**
 * Formats a clean, high-priority WhatsApp emergency flight delay broadcast message.
 * Formatted with standard WhatsApp bold (*text*), italic (_text_), and bullet emojis.
 */
export function formatWhatsAppNotification(item: IngestedNewsItem): string {
  const emoji = item.severity === 'CRITICAL' ? '🚨🚨 *CRITICAL FLIGHT DISASTER*' : item.severity === 'HIGH' ? '⚠️ *HIGH FLIGHT DELAY ALERT*' : '⚡ *MEDIUM DISRUPTION*';

  return (
`${emoji}
*GLOBAL FLIGHT DELAY NOTIFICATION*
Priority Score: ${item.priorityScore}/100

📍 *Incident:* ${item.headline}
🌐 *Source:* ${item.source} (${item.sourceCategory.replace(/_/g, ' ')})
🕒 *Time (UTC):* ${new Date(item.ingestedAt).toUTCString()}

*FLIGHT IMPACT SUMMARY:*
• ✈️ Delayed Flights: *~${item.estimatedDelayedFlights.toLocaleString()}*
• ❌ Cancellations: *~${item.estimatedCancelledFlights.toLocaleString()}*
• ⏳ Average Delay: *+${item.avgDelayMinutes} mins* (~${(item.avgDelayMinutes / 60).toFixed(1)} hrs)

*AFFECTED AIRSPACE & HUBS:*
• Airports: ${item.impactedAirports.join(', ')}
• FIRs: ${item.impactedFIRs.join(', ')}
• Corridors: ${item.primaryCorridors.join(' | ')}

📋 *OPERATIONAL DIRECTIVE:*
${item.recommendedAction || 'Monitor ATC advisories and notify station dispatch desks.'}

🔖 *NOTAM:* ${item.notamCode || 'ICAO-OPS-URGENT'}
_Dispatched via SkyAlert Flight Disruption Wire_`
  );
}

/**
 * Generates an official WhatsApp Click-to-Chat URL.
 * Opens WhatsApp Web or App with prefilled emergency dispatch message.
 * Can be sent to any phone number or group!
 */
export function buildWhatsAppShareUrl(phone: string, item: IngestedNewsItem): string {
  const message = formatWhatsAppNotification(item);
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Formats an executive incident email for Company Protected Email Lines
 */
export function formatEmailNotification(item: IngestedNewsItem): {
  subject: string;
  plainText: string;
  htmlBody: string;
} {
  const isCritical = item.severity === 'CRITICAL';
  const tag = isCritical ? 'CRITICAL DISASTER ALERT' : item.severity === 'HIGH' ? 'HIGH PRIORITY ADVISORY' : 'OPERATIONAL DISRUPTION ALERT';
  const color = isCritical ? '#ef4444' : item.severity === 'HIGH' ? '#f59e0b' : '#06b6d4';

  const subject = `[${tag}] ${item.headline} (${item.impactedAirports.slice(0, 3).join('/') || 'GLOBAL'})`;

  const plainText = `
=== ${tag} ===
INCIDENT: ${item.headline}
SEVERITY: ${item.severity} (Priority Score: ${item.priorityScore}/100)
TIME (UTC): ${new Date(item.ingestedAt).toUTCString()}
SOURCE: ${item.source} (${item.sourceCategory})

FLIGHT DISRUPTION METRICS:
- Estimated Delayed Flights: ~${item.estimatedDelayedFlights.toLocaleString()}
- Cancellations: ~${item.estimatedCancelledFlights.toLocaleString()}
- Average Delay Ripple: +${item.avgDelayMinutes} minutes
- Impacted Hubs: ${item.impactedAirports.join(', ')}
- Impacted FIRs & Corridors: ${item.impactedFIRs.concat(item.primaryCorridors).join(' | ')}

OPERATIONAL DIRECTIVE:
${item.recommendedAction || 'Monitor ATC advisories and notify station dispatch desks.'}

NOTAM REFERENCE: ${item.notamCode || 'ICAO-OPS-URGENT'}
---
Dispatched automatically by SkyAlert Company Data-Protected Line
`.trim();

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0c10; color: #f3f4f6; margin: 0; padding: 24px; }
    .card { background: #16171f; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 28px; max-width: 640px; margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; background: ${color}20; color: ${color}; border: 1px solid ${color}60; margin-bottom: 12px; }
    .title { font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; line-height: 1.4; }
    .summary { font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px; }
    .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: rgba(0,0,0,0.4); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.06); }
    .metric-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
    .metric-value { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 2px; }
    .directive { background: rgba(6,182,212,0.1); border-left: 4px solid #06b6d4; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #e5e7eb; margin-bottom: 20px; }
    .footer { font-size: 11px; color: #4b5563; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${tag} &bull; SCORE ${item.priorityScore}/100</div>
    <h1 class="title">${item.headline}</h1>
    <p class="summary">${item.summary}</p>
    
    <div class="metrics">
      <div>
        <div class="metric-label">Delayed Flights</div>
        <div class="metric-value" style="color: #f59e0b;">~${item.estimatedDelayedFlights.toLocaleString()}</div>
      </div>
      <div>
        <div class="metric-label">Cancellations</div>
        <div class="metric-value" style="color: #ef4444;">~${item.estimatedCancelledFlights.toLocaleString()}</div>
      </div>
      <div>
        <div class="metric-label">Average Delay</div>
        <div class="metric-value" style="color: #06b6d4;">+${item.avgDelayMinutes}m</div>
      </div>
      <div>
        <div class="metric-label">Impacted Hubs</div>
        <div class="metric-value" style="font-size: 13px; color: #ffffff;">${item.impactedAirports.join(', ')}</div>
      </div>
    </div>

    <div class="directive">
      <strong>Operational Directive:</strong><br>
      ${item.recommendedAction || 'Monitor ATC restrictions and execute station diversion plans.'}
    </div>

    <div class="footer">
      NOTAM Ref: ${item.notamCode || 'ICAO-OPS-URGENT'} &bull; Dispatched via SkyAlert Company Protected Line
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, plainText, htmlBody };
}
