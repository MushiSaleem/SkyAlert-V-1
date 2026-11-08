import { IngestedNewsItem, AlertSeverity, SystemDaemonConfig } from '../types/alert';

export interface FilterDecision {
  allowBroadcast: boolean;
  severity: AlertSeverity;
  priorityScore: number;
  reason: string;
}

/**
 * Evaluates whether an incoming news report or disaster update qualifies
 * for dispatch to the Microsoft Teams channel.
 *
 * User requirement: "it should be system which filters news, updates and send notification message
 * only through ms team channel... It should be only medium and high alerts only and prioritize critical updates while filtering out low-level noise."
 */
export function evaluateNewsNoiseFilter(
  item: Partial<IngestedNewsItem>,
  config?: Partial<SystemDaemonConfig>
): FilterDecision {
  const minSeverity = config?.minSeverity || 'MEDIUM';
  const minFlightImpact = config?.minFlightImpact ?? 40;

  let score = 0;

  // 1. Source Category and Hazard Weight
  switch (item.sourceCategory) {
    case 'VOLCANO_VAAC':
      score += 45; // Volcanic ash in cruise levels (engine glassing hazard)
      break;
    case 'INFRASTRUCTURE':
      score += 42; // DCS / Radar / NOTAM system failures
      break;
    case 'METEOROLOGY':
      score += 34; // Super typhoons, Cat 4/5 hurricanes, blizzard ground stops
      break;
    case 'NOTAM':
      score += 36; // Official civil aviation emergency closures
      break;
    case 'NEWS_WIRE':
    default:
      score += 20;
      break;
  }

  // 2. Flight Volume Ripple Weight
  const totalFlightsImpacted = (item.estimatedDelayedFlights || 0) + (item.estimatedCancelledFlights || 0);
  if (totalFlightsImpacted >= 1000) {
    score += 35;
  } else if (totalFlightsImpacted >= 300) {
    score += 28;
  } else if (totalFlightsImpacted >= 100) {
    score += 20;
  } else if (totalFlightsImpacted >= 40) {
    score += 12;
  } else {
    score += 4;
  }

  // 3. FIR / Airspace Scope Weight
  const firCount = item.impactedFIRs?.length || 0;
  if (firCount >= 3) {
    score += 15;
  } else if (firCount >= 1) {
    score += 8;
  }

  // 4. Mega-Hub Airport Presence
  const megaHubs = ['LHR', 'JFK', 'DXB', 'HND', 'SIN', 'FRA', 'CDG', 'HKG', 'LAX', 'AMS', 'ORD', 'DOH'];
  const hasMegaHub = item.impactedAirports?.some((hub) => megaHubs.includes(hub.toUpperCase()));
  if (hasMegaHub) {
    score += 10;
  }

  // Calculate Final Priority Score (0-100)
  const finalScore = Math.min(100, Math.max(5, score));

  // Determine Severity Level
  let calculatedSeverity: AlertSeverity = 'LOW';
  if (finalScore >= 80) {
    calculatedSeverity = 'CRITICAL';
  } else if (finalScore >= 62) {
    calculatedSeverity = 'HIGH';
  } else if (finalScore >= 45) {
    calculatedSeverity = 'MEDIUM';
  } else {
    calculatedSeverity = 'LOW';
  }

  // Enforce User Filter Rule: Strictly drop LOW noise
  const severityRank: Record<AlertSeverity, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  const minSeverityRank = severityRank[minSeverity];
  const currentSeverityRank = severityRank[calculatedSeverity];

  const passesFlightThreshold = totalFlightsImpacted >= minFlightImpact;
  const passesSeverityThreshold = currentSeverityRank >= minSeverityRank && calculatedSeverity !== 'LOW';

  if (!passesSeverityThreshold || !passesFlightThreshold) {
    let reason = '';
    if (calculatedSeverity === 'LOW') {
      reason = `DROPPED AS LOW NOISE: Priority score ${finalScore}/100. Routine local delay or isolated ground friction does not qualify for MS Teams broadcast.`;
    } else if (!passesFlightThreshold) {
      reason = `DROPPED AS LOW NOISE: Affected flight volume (${totalFlightsImpacted} flights) is below minimum threshold (${minFlightImpact} flights). Dropped to eliminate channel noise.`;
    } else {
      reason = `SUPPRESSED: Severity ${calculatedSeverity} is below configured minimum (${minSeverity}).`;
    }

    return {
      allowBroadcast: false,
      severity: calculatedSeverity,
      priorityScore: finalScore,
      reason,
    };
  }

  return {
    allowBroadcast: true,
    severity: calculatedSeverity,
    priorityScore: finalScore,
    reason: `QUALIFIED FOR MS TEAMS BROADCAST: ${calculatedSeverity} priority with disruption score ${finalScore}/100. ~${totalFlightsImpacted.toLocaleString()} flights impacted across ${item.impactedAirports?.join(', ') || 'multiple hubs'}.`,
  };
}
