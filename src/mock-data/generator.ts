// ============================================================
// Goa Sentinel — Mock Data Generator
// Produces realistic sentiment data with daily cycles,
// language distribution, and platform-appropriate metrics.
// ============================================================

import type {
  SentimentDataPoint,
  SentimentLabel,
  DataSource,
  Alert,
  AlertSeverity,
  CounterNarrative,
  DashboardSnapshot,
} from '@/types';

import {
  englishPosts,
  hindiPosts,
  russianPosts,
  languageDistribution,
  sourceWeights,
  authorHandles,
  allTopics,
  topicKeywords,
  platformUrlPatterns,
  platformMetricRanges,
  goaLocations,
  goaTourismFacts,
  counterNarrativeTemplates,
  positiveFacts,
  type LanguageConfig,
} from './seed-data';

// ─── Utility Helpers ───────────────────────────────────────

/** Seeded-random-safe random number in [min, max). */
function randBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return Math.floor(randBetween(min, max + 1));
}

/** Pick a random element from an array. */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick N unique random elements from an array. */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

/** Weighted random selection. Returns the index. */
function weightedRandom(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** Clamp a number between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ─── Daily Activity Cycle ──────────────────────────────────

/**
 * Returns an activity multiplier (0.0 - 1.0) based on the hour of day in IST.
 * Models realistic social media activity patterns:
 * - Low activity 00:00 - 06:00 IST
 * - Rising 07:00 - 10:00
 * - Peak 10:00 - 14:00
 * - Moderate 14:00 - 18:00
 * - Second peak 19:00 - 22:00
 * - Declining 22:00 - 00:00
 */
export function dailyActivityMultiplier(date: Date): number {
  // Convert to IST (UTC+5:30)
  const utcHour = date.getUTCHours();
  const utcMinute = date.getUTCMinutes();
  const istHour = (utcHour + 5 + Math.floor((utcMinute + 30) / 60)) % 24;

  // Activity curve as a lookup table (24 hours)
  const curve: number[] = [
    0.08, // 00:00
    0.05, // 01:00
    0.03, // 02:00
    0.02, // 03:00
    0.03, // 04:00
    0.05, // 05:00
    0.10, // 06:00
    0.25, // 07:00
    0.45, // 08:00
    0.65, // 09:00
    0.85, // 10:00
    0.95, // 11:00
    1.00, // 12:00 — peak
    0.90, // 13:00
    0.75, // 14:00
    0.65, // 15:00
    0.55, // 16:00
    0.50, // 17:00
    0.60, // 18:00
    0.75, // 19:00
    0.85, // 20:00
    0.80, // 21:00
    0.55, // 22:00
    0.25, // 23:00
  ];

  return curve[istHour];
}

// ─── Language Selection ────────────────────────────────────

function selectLanguage(): LanguageConfig {
  const weights = languageDistribution.map((l) => l.weight);
  const idx = weightedRandom(weights);
  return languageDistribution[idx];
}

// ─── Source Selection ──────────────────────────────────────

function selectSource(): DataSource {
  const sources = Object.keys(sourceWeights) as DataSource[];
  const weights = sources.map((s) => sourceWeights[s]);
  const idx = weightedRandom(weights);
  return sources[idx];
}

// ─── Sentiment Generation ──────────────────────────────────

/**
 * Generates a sentiment value with a slightly positive baseline.
 * Distribution:
 *   ~55% positive (0.05 to 0.9)
 *   ~30% neutral  (-0.15 to 0.15)
 *   ~15% negative (-0.9 to -0.05)
 * Baseline mean is approximately +0.3.
 */
function generateSentiment(overrideMean?: number): { sentiment: number; magnitude: number; label: SentimentLabel } {
  const mean = overrideMean ?? 0.3;
  const stdDev = 0.35;

  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const sentiment = clamp(mean + z * stdDev, -1.0, 1.0);

  // Magnitude correlates with how extreme the sentiment is
  const magnitude = clamp(Math.abs(sentiment) + randBetween(-0.1, 0.2), 0.0, 1.0);

  let label: SentimentLabel;
  if (sentiment > 0.15) label = 'positive';
  else if (sentiment < -0.15) label = 'negative';
  else label = 'neutral';

  return {
    sentiment: Math.round(sentiment * 1000) / 1000,
    magnitude: Math.round(magnitude * 1000) / 1000,
    label,
  };
}

// ─── Post Text Selection ───────────────────────────────────

function selectPostText(
  topic: string,
  language: string,
  sentimentLabel: SentimentLabel
): { originalText: string; translatedText?: string } {
  // For English, pull directly from the topic posts
  if (language === 'en') {
    const topicPosts = englishPosts[topic];
    if (topicPosts && topicPosts.length > 0) {
      // Try to match sentiment direction
      const post = pick(topicPosts);
      return { originalText: post };
    }
    // Fallback to a random topic
    const allPosts = Object.values(englishPosts).flat();
    return { originalText: pick(allPosts) };
  }

  // For Hindi
  if (language === 'hi') {
    const topicPosts = hindiPosts[topic] ?? hindiPosts['general'];
    if (topicPosts && topicPosts.length > 0) {
      const post = pick(topicPosts);
      // Provide English "translation"
      const translatedPosts = englishPosts[topic];
      const translated = translatedPosts ? pick(translatedPosts) : undefined;
      return { originalText: post, translatedText: translated };
    }
  }

  // For Russian
  if (language === 'ru') {
    const topicPosts = russianPosts[topic] ?? russianPosts['general'];
    if (topicPosts && topicPosts.length > 0) {
      const post = pick(topicPosts);
      const translatedPosts = englishPosts[topic];
      const translated = translatedPosts ? pick(translatedPosts) : undefined;
      return { originalText: post, translatedText: translated };
    }
  }

  // For other languages, use English text as "translated" and mark original as [Language]
  const topicPosts = englishPosts[topic];
  if (topicPosts && topicPosts.length > 0) {
    const englishText = pick(topicPosts);
    const langName = languageDistribution.find((l) => l.code === language)?.name ?? language;
    return {
      originalText: `[${langName} original] ${englishText}`,
      translatedText: englishText,
    };
  }

  // Last fallback
  const allPosts = Object.values(englishPosts).flat();
  return { originalText: pick(allPosts) };
}

// ─── Platform Metrics ──────────────────────────────────────

function generatePlatformMetrics(
  source: DataSource,
  isViral: boolean
): { views: number; likes: number; shares: number; comments: number } {
  const ranges = platformMetricRanges[source];
  const multiplier = isViral ? ranges.viralMultiplier : 1;

  return {
    views: randInt(ranges.views[0], ranges.views[1]) * multiplier,
    likes: randInt(ranges.likes[0], ranges.likes[1]) * multiplier,
    shares: randInt(ranges.shares[0], ranges.shares[1]) * multiplier,
    comments: randInt(ranges.comments[0], ranges.comments[1]) * multiplier,
  };
}

// ─── Authenticity Score ────────────────────────────────────

/**
 * Most posts are genuine (high authenticity). Only a small percentage
 * are flagged as potentially manufactured.
 */
function generateAuthenticityScore(): number {
  // 90% chance of genuine post (0.7-1.0), 10% chance of suspicious (0.1-0.5)
  if (Math.random() < 0.9) {
    return Math.round(randBetween(0.7, 1.0) * 100) / 100;
  }
  return Math.round(randBetween(0.1, 0.5) * 100) / 100;
}

// ─── Public API ────────────────────────────────────────────

/**
 * Generate a single realistic SentimentDataPoint.
 *
 * @param options - Optional overrides for specific fields.
 */
export function generateDataPoint(options?: {
  timestamp?: Date;
  source?: DataSource;
  sentimentOverride?: number;
  topicOverride?: string;
  isViral?: boolean;
  authenticityScore?: number;
  language?: string;
}): SentimentDataPoint {
  const timestamp = options?.timestamp ?? new Date();
  const source = options?.source ?? selectSource();
  const language = options?.language
    ? languageDistribution.find((l) => l.code === options.language) ?? selectLanguage()
    : selectLanguage();

  const { sentiment, magnitude, label } = generateSentiment(options?.sentimentOverride);
  const topic = options?.topicOverride ?? pick(allTopics);
  const isViral = options?.isViral ?? (Math.random() < 0.02); // 2% chance of viral
  const authenticityScore = options?.authenticityScore ?? generateAuthenticityScore();

  const { originalText, translatedText } = selectPostText(topic, language.code, label);

  const id = crypto.randomUUID();
  const sourceAuthors = authorHandles[source];
  const author = pick(sourceAuthors);

  // Assign 1-3 topics, with the primary topic always included
  const topicSet = new Set<string>([topic]);
  if (Math.random() > 0.4) topicSet.add(pick(allTopics));
  if (Math.random() > 0.7) topicSet.add(pick(allTopics));

  const platformMetrics = generatePlatformMetrics(source, isViral);

  return {
    id,
    source,
    timestamp,
    sentiment,
    magnitude,
    sentimentLabel: label,
    language: language.code,
    originalText,
    translatedText,
    author,
    authorFollowers: source === 'twitter' || source === 'instagram'
      ? randInt(50, 500000)
      : undefined,
    platformMetrics,
    topics: Array.from(topicSet),
    isViral,
    authenticityScore,
    location: Math.random() > 0.3 ? pick(goaLocations) : undefined,
    url: platformUrlPatterns[source](id.split('-')[0]),
  };
}

/**
 * Generate a batch of data points, distributed across a time window.
 *
 * @param count - Number of data points to generate.
 * @param timeWindowMs - Optional time window in milliseconds (default: last 1 hour).
 */
export function generateBatch(
  count: number,
  timeWindowMs: number = 60 * 60 * 1000
): SentimentDataPoint[] {
  const now = Date.now();
  const points: SentimentDataPoint[] = [];

  for (let i = 0; i < count; i++) {
    const offset = Math.random() * timeWindowMs;
    const timestamp = new Date(now - offset);

    // Adjust volume based on time-of-day activity
    const activity = dailyActivityMultiplier(timestamp);
    if (Math.random() > activity) {
      // Skip some points during low-activity periods to create realistic gaps
      continue;
    }

    points.push(generateDataPoint({ timestamp }));
  }

  // Sort chronologically
  return points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Generate a time series of data points over a specified number of hours.
 * Respects daily activity cycles for realistic volume distribution.
 *
 * @param hours - Number of hours to generate data for.
 * @param basePostsPerHour - Average posts per hour at peak activity (default: 25).
 */
export function generateTimeSeries(
  hours: number,
  basePostsPerHour: number = 25
): SentimentDataPoint[] {
  const now = Date.now();
  const points: SentimentDataPoint[] = [];

  for (let h = hours; h > 0; h--) {
    const hourStart = new Date(now - h * 60 * 60 * 1000);
    const activity = dailyActivityMultiplier(hourStart);
    const postsThisHour = Math.max(1, Math.round(basePostsPerHour * activity));

    for (let p = 0; p < postsThisHour; p++) {
      const minuteOffset = Math.random() * 60 * 60 * 1000; // random minute within hour
      const timestamp = new Date(hourStart.getTime() + minuteOffset);
      points.push(generateDataPoint({ timestamp }));
    }
  }

  return points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// ─── Alert Generation ──────────────────────────────────────

/**
 * Create an Alert from a triggering SentimentDataPoint.
 */
export function generateAlert(
  triggerPost: SentimentDataPoint,
  type: Alert['type'],
  severity: AlertSeverity
): Alert {
  const counterNarratives = generateCounterNarratives(triggerPost);

  return {
    id: crypto.randomUUID(),
    type,
    severity,
    status: 'active',
    triggerPost,
    generatedResponses: counterNarratives,
    createdAt: new Date(triggerPost.timestamp.getTime() + randInt(5000, 30000)), // 5-30s after post
  };
}

/**
 * Generate counter-narrative responses for a negative post.
 */
function generateCounterNarratives(triggerPost: SentimentDataPoint): CounterNarrative[] {
  const primaryTopic = triggerPost.topics[0] ?? 'tourism';
  const narratives: CounterNarrative[] = [];

  // Generate one of each type
  const types: CounterNarrative['type'][] = ['acknowledge_address', 'provide_context', 'redirect_positive'];
  const platforms: DataSource[] = ['twitter', 'instagram', 'reddit'];

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const templates = counterNarrativeTemplates[type];
    let text = pick(templates);

    // Fill in template placeholders
    text = text
      .replace('{issue}', primaryTopic)
      .replace('{topic}', primaryTopic)
      .replace('{author}', triggerPost.author)
      .replace('{action}', 'increased monitoring and immediate ground-level inspection')
      .replace('{detail}', 'beach maintenance, road improvement, and safety infrastructure')
      .replace('{fact}', pick(goaTourismFacts))
      .replace('{positive_fact}', pick(positiveFacts));

    narratives.push({
      id: crypto.randomUUID(),
      type,
      text,
      platform: platforms[i % platforms.length],
      approved: false,
      generatedAt: new Date(),
    });
  }

  return narratives;
}

// ─── Dashboard Snapshot ────────────────────────────────────

/**
 * Generate a complete DashboardSnapshot with realistic aggregate data.
 * This is what the dashboard loads on first render.
 */
export function generateDashboardSnapshot(): DashboardSnapshot {
  // Generate 24 hours of data for the time series
  const allPosts = generateTimeSeries(24, 20);
  const last24h = allPosts;

  // Overall sentiment — weighted average
  const overallSentiment = last24h.length > 0
    ? Math.round(
        (last24h.reduce((sum, p) => sum + p.sentiment, 0) / last24h.length) * 1000
      ) / 1000
    : 0.3;

  // Sentiment by source
  const sentimentBySource: Record<DataSource, number> = {
    twitter: 0,
    reddit: 0,
    instagram: 0,
    news: 0,
    google_reviews: 0,
    tripadvisor: 0,
  };

  const countBySource: Record<DataSource, number> = {
    twitter: 0,
    reddit: 0,
    instagram: 0,
    news: 0,
    google_reviews: 0,
    tripadvisor: 0,
  };

  for (const post of last24h) {
    sentimentBySource[post.source] += post.sentiment;
    countBySource[post.source]++;
  }

  for (const src of Object.keys(sentimentBySource) as DataSource[]) {
    sentimentBySource[src] = countBySource[src] > 0
      ? Math.round((sentimentBySource[src] / countBySource[src]) * 1000) / 1000
      : 0;
  }

  // Sentiment by language
  const langSentiment: Record<string, { total: number; count: number }> = {};
  for (const post of last24h) {
    if (!langSentiment[post.language]) {
      langSentiment[post.language] = { total: 0, count: 0 };
    }
    langSentiment[post.language].total += post.sentiment;
    langSentiment[post.language].count++;
  }

  const sentimentByLanguage: Record<string, { score: number; percentage: number }> = {};
  for (const [lang, data] of Object.entries(langSentiment)) {
    sentimentByLanguage[lang] = {
      score: Math.round((data.total / data.count) * 1000) / 1000,
      percentage: Math.round((data.count / last24h.length) * 1000) / 10,
    };
  }

  // Hourly trend
  const hourlyBuckets: Map<string, { sentimentSum: number; count: number }> = new Map();
  for (const post of last24h) {
    const hourKey = post.timestamp.toISOString().slice(0, 13) + ':00';
    const bucket = hourlyBuckets.get(hourKey) ?? { sentimentSum: 0, count: 0 };
    bucket.sentimentSum += post.sentiment;
    bucket.count++;
    hourlyBuckets.set(hourKey, bucket);
  }

  const hourlyTrend = Array.from(hourlyBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, data]) => ({
      hour,
      sentiment: Math.round((data.sentimentSum / data.count) * 1000) / 1000,
      volume: data.count,
    }));

  // Topic frequency
  const topicCounts: Record<string, number> = {};
  for (const post of last24h) {
    for (const t of post.topics) {
      topicCounts[t] = (topicCounts[t] ?? 0) + 1;
    }
  }
  const topTrendingTopic = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'beaches';

  // Generate a few sample alerts
  const negativePosts = last24h.filter((p) => p.sentiment < -0.4);
  const alerts: Alert[] = [];

  if (negativePosts.length > 0) {
    // One viral_negative alert from the most negative post
    const worstPost = negativePosts.sort((a, b) => a.sentiment - b.sentiment)[0];
    alerts.push(generateAlert(worstPost, 'viral_negative', 'high'));
  }

  if (negativePosts.length > 2) {
    // One sentiment_drop alert
    alerts.push(generateAlert(pick(negativePosts), 'sentiment_drop', 'medium'));
  }

  // Recent posts — last 20
  const recentPosts = last24h.slice(-20);

  return {
    overallSentiment,
    totalMentionsToday: last24h.length,
    mentionsTrend: Math.round(randBetween(-8, 15) * 10) / 10, // % change
    activeAlerts: alerts.filter((a) => a.status === 'active').length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    topTrendingTopic,
    sentimentBySource,
    sentimentByLanguage,
    hourlyTrend,
    recentPosts,
    activeAlertsList: alerts,
  };
}
