// ============================================================
// Goa Sentinel — Alert Management Service
// ============================================================
// Evaluates incoming posts, creates alerts, manages alert
// lifecycle, and auto-triggers counter-narrative generation
// for high-severity alerts.
//
// Prototype: In-memory alert store.
// TODO: Replace with PostgreSQL + Redis pub/sub for production:
//   - Store alerts in PostgreSQL with proper indexing
//   - Use Redis pub/sub to broadcast new alerts to SSE connections
//   - Add alert deduplication (same story, multiple platforms)
//   - Add alert escalation (severity upgrades over time)
//   - Add notification integrations (SMS, WhatsApp, email)
// ============================================================

import type {
  SentimentDataPoint,
  Alert,
  AlertType,
  AlertSeverity,
  CounterNarrative,
} from '@/types';
import { calculateRiskScore, getAlertLevel, calculateVelocity } from '@/services/viral-detection';
import { classifyComplaint } from '@/services/complaint-classifier';
import { generateCounterNarrative } from '@/services/counter-narrative';

// --- In-Memory Alert Store ---

const alertStore: Map<string, Alert> = new Map();

// --- Configuration ---

const CONFIG = {
  /** Minimum risk score to generate an alert */
  minRiskScoreForAlert: 0.25,

  /** Minimum negative sentiment to trigger evaluation */
  minNegativeSentiment: -0.2,

  /** View thresholds for viral alerts */
  viralViewThreshold: 10_000,

  /** Severity thresholds based on risk score */
  severityThresholds: {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
    // critical: above high
  },

  /** Auto-generate counter-narratives for these severities */
  autoCounterNarrativeSeverities: ['high', 'critical'] as AlertSeverity[],

  /** Maximum alerts to keep in memory */
  maxAlerts: 1000,

  /** Alert deduplication window (ms) — same author, same topic */
  deduplicationWindowMs: 30 * 60 * 1000, // 30 minutes
} as const;

// --- Core Functions ---

/**
 * Evaluate a post and create an alert if warranted.
 *
 * Decision flow:
 * 1. Check if the post has negative sentiment (skip neutral/positive)
 * 2. Calculate risk score
 * 3. Check for viral velocity
 * 4. Classify complaint authenticity
 * 5. Determine alert type and severity
 * 6. Create alert (with deduplication check)
 * 7. Auto-trigger counter-narrative for high/critical alerts
 *
 * @param post - The incoming post to evaluate
 * @returns Alert if one was created, null otherwise
 */
export async function evaluatePost(post: SentimentDataPoint): Promise<Alert | null> {
  // Step 1: Quick filter — only evaluate concerning posts
  if (post.sentiment > CONFIG.minNegativeSentiment && !post.isViral) {
    return null;
  }

  // Step 2: Calculate risk score
  const riskScore = calculateRiskScore(post);
  const alertLevel = getAlertLevel(riskScore, post.platformMetrics.views);

  // No alert needed for green level (unless sentiment is extremely negative)
  if (alertLevel === 'green' && post.sentiment > -0.7) {
    return null;
  }

  // Step 3: Check for minimum alert threshold
  if (riskScore < CONFIG.minRiskScoreForAlert && post.platformMetrics.views < CONFIG.viralViewThreshold) {
    return null;
  }

  // Step 4: Classify complaint
  const classification = classifyComplaint(post);

  // Step 5: Determine alert type
  const alertType = determineAlertType(post, classification.isManufactured, riskScore);

  // Step 6: Determine severity
  const severity = determineSeverity(riskScore, post.platformMetrics.views, alertType);

  // Step 7: Deduplication check
  if (isDuplicate(post, alertType)) {
    return null;
  }

  // Step 8: Create alert
  const alert: Alert = {
    id: generateAlertId(),
    type: alertType,
    severity,
    status: 'active',
    triggerPost: post,
    createdAt: new Date(),
  };

  // Step 9: Store alert
  storeAlert(alert);

  // Step 10: Auto-generate counter-narratives for high/critical alerts
  if (CONFIG.autoCounterNarrativeSeverities.includes(severity)) {
    try {
      const narratives = await generateCounterNarrative(post, alertType);
      alert.generatedResponses = narratives;
      alertStore.set(alert.id, alert); // Update stored alert
    } catch {
      // Counter-narrative generation failed — alert is still valid
      // TODO: Log error and retry via job queue in production
    }
  }

  return alert;
}

/**
 * Get all currently active alerts, sorted by severity (critical first)
 * and creation time (newest first within same severity).
 */
export function getActiveAlerts(): Alert[] {
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return Array.from(alertStore.values())
    .filter(alert => alert.status === 'active')
    .sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
}

/**
 * Get all alerts (including acknowledged/resolved), optionally filtered.
 */
export function getAllAlerts(filters?: {
  status?: Alert['status'];
  type?: AlertType;
  severity?: AlertSeverity;
  since?: Date;
}): Alert[] {
  let alerts = Array.from(alertStore.values());

  if (filters) {
    if (filters.status) {
      alerts = alerts.filter(a => a.status === filters.status);
    }
    if (filters.type) {
      alerts = alerts.filter(a => a.type === filters.type);
    }
    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    if (filters.since) {
      const since = filters.since.getTime();
      alerts = alerts.filter(a => a.createdAt.getTime() >= since);
    }
  }

  return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Acknowledge an alert (mark it as seen/being handled).
 *
 * @param id - Alert ID
 * @param by - Name/identifier of the person acknowledging
 */
export function acknowledgeAlert(id: string, by: string): void {
  const alert = alertStore.get(id);
  if (!alert) {
    throw new Error(`Alert not found: ${id}`);
  }
  if (alert.status !== 'active') {
    throw new Error(`Alert ${id} is already ${alert.status}`);
  }

  alert.status = 'acknowledged';
  alert.acknowledgedAt = new Date();
  alert.acknowledgedBy = by;
  alertStore.set(id, alert);
}

/**
 * Resolve an alert (mark it as fully handled).
 *
 * @param id - Alert ID
 */
export function resolveAlert(id: string): void {
  const alert = alertStore.get(id);
  if (!alert) {
    throw new Error(`Alert not found: ${id}`);
  }

  alert.status = 'resolved';
  alertStore.set(id, alert);
}

/**
 * Get a single alert by ID.
 */
export function getAlertById(id: string): Alert | undefined {
  return alertStore.get(id);
}

/**
 * Get alert statistics summary.
 */
export function getAlertStats(): {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  bySeverity: Record<AlertSeverity, number>;
  byType: Record<AlertType, number>;
} {
  const alerts = Array.from(alertStore.values());

  const bySeverity: Record<AlertSeverity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const byType: Record<AlertType, number> = {
    viral_negative: 0,
    coordinated_attack: 0,
    trending_topic: 0,
    sentiment_drop: 0,
  };

  let active = 0;
  let acknowledged = 0;
  let resolved = 0;

  for (const alert of alerts) {
    if (alert.status === 'active') active++;
    else if (alert.status === 'acknowledged') acknowledged++;
    else if (alert.status === 'resolved') resolved++;

    bySeverity[alert.severity]++;
    byType[alert.type]++;
  }

  return {
    total: alerts.length,
    active,
    acknowledged,
    resolved,
    bySeverity,
    byType,
  };
}

/**
 * Attach counter-narratives to an existing alert.
 */
export function attachCounterNarratives(alertId: string, narratives: CounterNarrative[]): void {
  const alert = alertStore.get(alertId);
  if (!alert) {
    throw new Error(`Alert not found: ${alertId}`);
  }

  alert.generatedResponses = [
    ...(alert.generatedResponses ?? []),
    ...narratives,
  ];
  alertStore.set(alertId, alert);
}

/**
 * Clear all alerts. Useful for testing.
 */
export function clearAlerts(): void {
  alertStore.clear();
}

// --- Internal Functions ---

function determineAlertType(
  post: SentimentDataPoint,
  isManufactured: boolean,
  riskScore: number
): AlertType {
  // Coordinated attack takes priority if manufactured
  if (isManufactured) {
    return 'coordinated_attack';
  }

  // Viral negative: high engagement + negative sentiment
  if (post.platformMetrics.views > CONFIG.viralViewThreshold || post.isViral) {
    return 'viral_negative';
  }

  // Trending topic: multiple topics gaining traction
  if (post.topics.length > 2 && riskScore > 0.4) {
    return 'trending_topic';
  }

  // Sentiment drop: significant negative sentiment
  if (post.sentiment < -0.5) {
    return 'sentiment_drop';
  }

  // Default to viral_negative for anything else that triggered an alert
  return 'viral_negative';
}

function determineSeverity(
  riskScore: number,
  views: number,
  alertType: AlertType
): AlertSeverity {
  // Coordinated attacks are automatically elevated
  const isCoordinated = alertType === 'coordinated_attack';

  if (riskScore > CONFIG.severityThresholds.high || views > 50_000) {
    return 'critical';
  }
  if (riskScore > CONFIG.severityThresholds.medium || views > 10_000 || isCoordinated) {
    return 'high';
  }
  if (riskScore > CONFIG.severityThresholds.low || views > 5_000) {
    return 'medium';
  }
  return 'low';
}

function isDuplicate(post: SentimentDataPoint, alertType: AlertType): boolean {
  const now = Date.now();

  for (const alert of alertStore.values()) {
    // Only check recent alerts
    if (now - alert.createdAt.getTime() > CONFIG.deduplicationWindowMs) {
      continue;
    }

    // Same author, same type
    if (alert.triggerPost.author === post.author && alert.type === alertType) {
      return true;
    }

    // Same topic overlap and same type within window
    if (alert.type === alertType) {
      const overlap = post.topics.some(t =>
        alert.triggerPost.topics.some(at =>
          at.toLowerCase() === t.toLowerCase()
        )
      );
      // Same URL = definitely duplicate
      if (alert.triggerPost.url === post.url) {
        return true;
      }
      // High text similarity + topic overlap = likely duplicate
      if (overlap && textSimilarity(post.originalText, alert.triggerPost.originalText) > 0.7) {
        return true;
      }
    }
  }

  return false;
}

function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

function storeAlert(alert: Alert): void {
  alertStore.set(alert.id, alert);

  // Prune old resolved alerts if we're over the limit
  if (alertStore.size > CONFIG.maxAlerts) {
    const allAlerts = Array.from(alertStore.entries())
      .sort((a, b) => a[1].createdAt.getTime() - b[1].createdAt.getTime());

    for (const [id, alert] of allAlerts) {
      if (alertStore.size <= CONFIG.maxAlerts * 0.8) break;
      if (alert.status === 'resolved') {
        alertStore.delete(id);
      }
    }
  }
}

function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
