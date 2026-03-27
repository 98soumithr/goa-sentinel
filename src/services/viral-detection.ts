// ============================================================
// Goa Sentinel — Viral / Trend Detection Service
// ============================================================
// Algorithm from research:
//   velocity = (engagement_delta / time_delta) * platform_weight
//
// Alert thresholds:
//   green  — risk < 0.3
//   yellow — risk 0.3–0.6 OR views > 5K
//   orange — risk 0.6–0.8 OR views > 10K
//   red    — risk > 0.8 OR views > 50K
// ============================================================

import type { SentimentDataPoint, DataSource, ViralMetrics } from '@/types';

// --- Platform Weights ---
// Higher weight = content spreads faster on this platform

const PLATFORM_WEIGHTS: Record<DataSource, number> = {
  twitter: 1.5,      // Fastest spread, real-time
  reddit: 1.2,       // Can go viral quickly via upvotes
  instagram: 1.3,    // Visual content, high engagement
  news: 1.0,         // Steady but authoritative
  google_reviews: 0.6, // Slow burn, persistent impact
  tripadvisor: 0.7,  // Slow burn, high decision influence
};

// --- Engagement Weight by Type ---
// Views are base; likes/shares/comments have multiplied impact

const ENGAGEMENT_WEIGHTS = {
  views: 1.0,
  likes: 2.0,
  shares: 5.0,     // Shares have the highest viral potential
  comments: 3.0,   // Comments indicate deeper engagement
};

// --- Alert Thresholds ---

const THRESHOLDS = {
  green: { maxRisk: 0.3, maxViews: 5_000 },
  yellow: { maxRisk: 0.6, maxViews: 10_000 },
  orange: { maxRisk: 0.8, maxViews: 50_000 },
  // red: anything above orange
} as const;

// --- In-Memory Metrics Store ---
// Stores previous metrics for velocity calculation

interface StoredMetrics {
  postId: string;
  timestamp: number;
  totalEngagement: number;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

const metricsHistory: Map<string, StoredMetrics[]> = new Map();

// --- Core Functions ---

/**
 * Calculate the total weighted engagement score for a post.
 */
function calculateWeightedEngagement(metrics: SentimentDataPoint['platformMetrics']): number {
  return (
    metrics.views * ENGAGEMENT_WEIGHTS.views +
    metrics.likes * ENGAGEMENT_WEIGHTS.likes +
    metrics.shares * ENGAGEMENT_WEIGHTS.shares +
    metrics.comments * ENGAGEMENT_WEIGHTS.comments
  );
}

/**
 * Calculate the velocity of engagement growth for a post.
 *
 * velocity = (engagement_delta / time_delta) * platform_weight
 *
 * @param post - The current post data
 * @param previousMetrics - Optional previous metrics snapshot for delta calculation
 * @returns Velocity score (higher = faster growth)
 */
export function calculateVelocity(
  post: SentimentDataPoint,
  previousMetrics?: { totalEngagement: number; timestamp: number }
): number {
  const currentEngagement = calculateWeightedEngagement(post.platformMetrics);
  const currentTimestamp = post.timestamp instanceof Date
    ? post.timestamp.getTime()
    : Date.now();
  const platformWeight = PLATFORM_WEIGHTS[post.source] ?? 1.0;

  // Store current metrics for future delta calculations
  const history = metricsHistory.get(post.id) ?? [];
  history.push({
    postId: post.id,
    timestamp: currentTimestamp,
    totalEngagement: currentEngagement,
    views: post.platformMetrics.views,
    likes: post.platformMetrics.likes,
    shares: post.platformMetrics.shares,
    comments: post.platformMetrics.comments,
  });
  // Keep only last 20 snapshots per post
  if (history.length > 20) history.shift();
  metricsHistory.set(post.id, history);

  // Determine previous state
  let prevEngagement: number;
  let prevTimestamp: number;

  if (previousMetrics) {
    prevEngagement = previousMetrics.totalEngagement;
    prevTimestamp = previousMetrics.timestamp;
  } else if (history.length >= 2) {
    const prev = history[history.length - 2];
    prevEngagement = prev.totalEngagement;
    prevTimestamp = prev.timestamp;
  } else {
    // First observation — estimate velocity from absolute engagement
    // Assume the post has been live for 1 hour if no previous data
    const assumedTimeDeltaMs = 60 * 60 * 1000; // 1 hour
    return (currentEngagement / assumedTimeDeltaMs) * platformWeight * 1000; // per second
  }

  const engagementDelta = currentEngagement - prevEngagement;
  const timeDeltaMs = Math.max(currentTimestamp - prevTimestamp, 1000); // Minimum 1 second
  const timeDeltaSeconds = timeDeltaMs / 1000;

  // velocity = (engagement_delta / time_delta) * platform_weight
  const velocity = (engagementDelta / timeDeltaSeconds) * platformWeight;

  return Math.max(0, velocity); // Velocity is non-negative
}

/**
 * Calculate a risk score for a post (0–1 scale).
 *
 * Factors:
 * - Negative sentiment (higher negative = higher risk)
 * - Engagement volume (more engagement = higher risk if negative)
 * - Velocity (faster growth = higher risk)
 * - Author influence (more followers = higher risk)
 * - Platform reach (some platforms amplify more)
 * - Authenticity (lower authenticity = potentially manufactured)
 *
 * @param post - The post to evaluate
 * @returns Risk score between 0 and 1
 */
export function calculateRiskScore(post: SentimentDataPoint): number {
  // Factor 1: Sentiment negativity (0-1, where 1 = most negative)
  const sentimentRisk = Math.max(0, -post.sentiment); // Only negative sentiment contributes

  // Factor 2: Engagement volume risk
  const totalEngagement = post.platformMetrics.views +
    post.platformMetrics.likes * 2 +
    post.platformMetrics.shares * 3 +
    post.platformMetrics.comments * 2;
  // Sigmoid-like scaling: plateaus around 100K total engagement
  const engagementRisk = 1 - (1 / (1 + totalEngagement / 10_000));

  // Factor 3: Velocity risk
  const velocity = calculateVelocity(post);
  // Sigmoid scaling: plateaus around velocity of 100
  const velocityRisk = 1 - (1 / (1 + velocity / 50));

  // Factor 4: Author influence
  const followers = post.authorFollowers ?? 0;
  const influenceRisk = Math.min(1, followers / 100_000);

  // Factor 5: Platform amplification
  const platformWeight = PLATFORM_WEIGHTS[post.source] ?? 1.0;
  const platformRisk = (platformWeight - 0.5) / 1.0; // Normalize to ~0-1

  // Factor 6: Authenticity (inverted — low authenticity = manufactured = higher risk)
  const manufacturingRisk = 1 - post.authenticityScore;

  // Weighted combination
  const riskScore =
    sentimentRisk * 0.30 +      // Sentiment is the primary driver
    engagementRisk * 0.25 +     // Volume matters
    velocityRisk * 0.20 +       // Speed of spread
    influenceRisk * 0.10 +      // Author reach
    platformRisk * 0.05 +       // Platform factor
    manufacturingRisk * 0.10;   // Manufacturing signal

  return clamp(riskScore, 0, 1);
}

/**
 * Determine the alert level based on risk score and view count.
 *
 * Thresholds (OR logic — whichever is higher wins):
 *   green  — risk < 0.3 AND views < 5K
 *   yellow — risk 0.3–0.6 OR views 5K–10K
 *   orange — risk 0.6–0.8 OR views 10K–50K
 *   red    — risk > 0.8 OR views > 50K
 */
export function getAlertLevel(
  riskScore: number,
  views: number
): 'green' | 'yellow' | 'orange' | 'red' {
  // Check from highest to lowest severity
  if (riskScore > THRESHOLDS.orange.maxRisk || views > THRESHOLDS.orange.maxViews) {
    return 'red';
  }
  if (riskScore > THRESHOLDS.yellow.maxRisk || views > THRESHOLDS.yellow.maxViews) {
    return 'orange';
  }
  if (riskScore > THRESHOLDS.green.maxRisk || views > THRESHOLDS.green.maxViews) {
    return 'yellow';
  }
  return 'green';
}

/**
 * Detect trending topics from a collection of posts.
 *
 * Groups posts by topic, counts occurrences, and calculates
 * average sentiment per topic.
 *
 * @param posts - Array of posts to analyze
 * @returns Sorted array of trending topics (most frequent first)
 */
export function detectTrendingTopics(
  posts: SentimentDataPoint[]
): { topic: string; count: number; sentiment: number }[] {
  const topicMap = new Map<string, { count: number; totalSentiment: number }>();

  for (const post of posts) {
    for (const topic of post.topics) {
      const normalized = topic.toLowerCase().trim();
      if (!normalized) continue;

      const existing = topicMap.get(normalized) ?? { count: 0, totalSentiment: 0 };
      existing.count += 1;
      existing.totalSentiment += post.sentiment;
      topicMap.set(normalized, existing);
    }
  }

  const topics = Array.from(topicMap.entries()).map(([topic, data]) => ({
    topic,
    count: data.count,
    sentiment: roundTo(data.totalSentiment / data.count, 3),
  }));

  // Sort by count descending, then by absolute sentiment (most polarized first) as tiebreaker
  topics.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return Math.abs(b.sentiment) - Math.abs(a.sentiment);
  });

  return topics;
}

/**
 * Build full viral metrics for a post.
 * Convenience function combining velocity, risk, and alert level.
 */
export function buildViralMetrics(post: SentimentDataPoint): ViralMetrics {
  const velocityScore = calculateVelocity(post);
  const riskScore = calculateRiskScore(post);
  const alertLevel = getAlertLevel(riskScore, post.platformMetrics.views);

  // Simple acceleration: compare current velocity to previous
  const history = metricsHistory.get(post.id) ?? [];
  let acceleration = 0;
  if (history.length >= 3) {
    const recentVelocities: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const dt = Math.max((history[i].timestamp - history[i - 1].timestamp) / 1000, 1);
      const de = history[i].totalEngagement - history[i - 1].totalEngagement;
      recentVelocities.push(de / dt);
    }
    if (recentVelocities.length >= 2) {
      const latest = recentVelocities[recentVelocities.length - 1];
      const previous = recentVelocities[recentVelocities.length - 2];
      acceleration = latest - previous;
    }
  }

  // Project 24h views based on current velocity
  const currentViews = post.platformMetrics.views;
  const projectedGrowthRate = Math.max(1, 1 + velocityScore * 0.01);
  const projectedViews24h = Math.round(currentViews * Math.pow(projectedGrowthRate, 24));

  return {
    postId: post.id,
    velocityScore: roundTo(velocityScore, 3),
    acceleration: roundTo(acceleration, 3),
    riskScore: roundTo(riskScore, 3),
    isViral: alertLevel === 'red' || alertLevel === 'orange',
    alertLevel,
    projectedViews24h: Math.min(projectedViews24h, 100_000_000), // Cap at 100M
  };
}

/**
 * Clear stored metrics history. Useful for testing.
 */
export function clearMetricsHistory(): void {
  metricsHistory.clear();
}

// --- Utilities ---

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
