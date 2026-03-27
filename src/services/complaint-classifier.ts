// ============================================================
// Goa Sentinel — Complaint Classifier Service
// ============================================================
// Detects whether a complaint/negative post is genuine or
// manufactured (coordinated, bot-driven, or competitive).
//
// Prototype: Heuristic-based scoring using observable signals.
// TODO: Replace with Claude API for production:
//   - Use Claude Sonnet for deep linguistic analysis
//   - Prompt: "Analyze this post for signs of manufactured
//     or inauthentic content. Consider: linguistic patterns,
//     specificity of claims, emotional manipulation markers,
//     copy-paste indicators, and coordination signals.
//     Post: {post.originalText}
//     Author: {post.author}
//     Platform: {post.source}
//     Return JSON: { isManufactured, confidence, signals[] }"
//   - Cross-reference with historical patterns stored in DB
// ============================================================

import type { SentimentDataPoint } from '@/types';

// --- Classification Result ---

export interface ComplaintClassification {
  isManufactured: boolean;
  confidence: number;    // 0-1, how confident we are in the classification
  signals: string[];     // Human-readable reasons for the classification
}

// --- Signal Weights ---
// Each signal contributes a weighted score toward "manufactured" classification

interface SignalCheck {
  name: string;
  description: string;
  weight: number;         // 0-1, how much this signal contributes
  check: (post: SentimentDataPoint) => boolean;
}

// --- Generic / Template Language Patterns ---

const GENERIC_PHRASES = [
  'worst experience ever',
  'never going back',
  'total disaster',
  'completely ruined',
  'stay away from',
  'do not visit',
  'warning to all',
  'spread the word',
  'share this post',
  'make this viral',
  'everyone needs to know',
  'boycott',
  'worst state in india',
  'worst destination',
  'i heard that',
  'someone told me',
  'my friend said',
  'apparently in goa',
  'they say goa',
];

const COPY_PASTE_INDICATORS = [
  // Overly formal or press-release-like language in casual platforms
  'it has come to our attention',
  'we would like to bring to notice',
  'this is to inform',
  'for immediate release',
  'urgent attention required',
];

// --- Coordination Patterns ---
// In-memory store of recent posts to detect coordination

interface RecentPostRecord {
  author: string;
  text: string;
  timestamp: number;
  source: string;
  topics: string[];
}

const recentPosts: RecentPostRecord[] = [];
const MAX_RECENT_POSTS = 500;

// --- Signal Definitions ---

const SIGNAL_CHECKS: SignalCheck[] = [
  {
    name: 'new_account',
    description: 'Account appears to be newly created or has very low activity',
    weight: 0.15,
    check: (post) => {
      // Heuristic: accounts with generic names and low followers
      const hasGenericName = /^(user|tourist|visitor|traveler|guest)\d+/i.test(post.author) ||
        /^[a-z]{2,4}\d{4,}/i.test(post.author);
      const lowFollowers = (post.authorFollowers ?? 0) < 50;
      return hasGenericName || lowFollowers;
    },
  },
  {
    name: 'generic_language',
    description: 'Post uses generic, template-like negative language without specific details',
    weight: 0.20,
    check: (post) => {
      const text = post.originalText.toLowerCase();
      const matchCount = GENERIC_PHRASES.filter(phrase => text.includes(phrase)).length;
      return matchCount >= 2; // At least 2 generic phrases
    },
  },
  {
    name: 'no_specific_details',
    description: 'Post lacks specific details (dates, locations, names, prices)',
    weight: 0.15,
    check: (post) => {
      const text = post.originalText;
      // Check for specific markers: dates, prices, place names, hotel names
      const hasDate = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/.test(text) ||
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text) ||
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(text);
      const hasPrice = /₹\s*\d+|rs\.?\s*\d+|\$\s*\d+/i.test(text);
      const hasLocation = /\b(calangute|baga|anjuna|palolem|vagator|candolim|panjim|mapusa|margao|vasco|old goa|dona paula|miramar|colva|benaulim)\b/i.test(text);
      const hasSpecificName = text.length > 100; // Longer posts tend to have more detail

      const specificityScore = (hasDate ? 1 : 0) + (hasPrice ? 1 : 0) + (hasLocation ? 1 : 0) + (hasSpecificName ? 1 : 0);
      return specificityScore === 0; // No specific details at all
    },
  },
  {
    name: 'copy_paste_language',
    description: 'Post uses copy-paste or press-release-like language',
    weight: 0.20,
    check: (post) => {
      const text = post.originalText.toLowerCase();
      return COPY_PASTE_INDICATORS.some(indicator => text.includes(indicator));
    },
  },
  {
    name: 'extreme_sentiment_short_text',
    description: 'Extremely negative sentiment in very short text (hit-and-run attack pattern)',
    weight: 0.10,
    check: (post) => {
      const isExtreme = post.sentiment < -0.7;
      const isShort = post.originalText.split(/\s+/).length < 15;
      return isExtreme && isShort;
    },
  },
  {
    name: 'coordination_pattern',
    description: 'Similar content posted by multiple accounts in a short time window',
    weight: 0.25,
    check: (post) => {
      const now = Date.now();
      const windowMs = 2 * 60 * 60 * 1000; // 2-hour window

      // Find similar recent posts (same topics, similar text, different authors)
      const similarPosts = recentPosts.filter(recent => {
        if (recent.author === post.author) return false;
        if (now - recent.timestamp > windowMs) return false;

        // Check topic overlap
        const topicOverlap = post.topics.some(t =>
          recent.topics.some(rt => rt.toLowerCase() === t.toLowerCase())
        );

        // Check text similarity (simple Jaccard on words)
        const postWords = new Set(post.originalText.toLowerCase().split(/\s+/));
        const recentWords = new Set(recent.text.toLowerCase().split(/\s+/));
        const intersection = [...postWords].filter(w => recentWords.has(w)).length;
        const union = new Set([...postWords, ...recentWords]).size;
        const similarity = union > 0 ? intersection / union : 0;

        return topicOverlap && similarity > 0.4;
      });

      return similarPosts.length >= 2; // 3+ similar posts = coordination
    },
  },
  {
    name: 'competitive_targeting',
    description: 'Post promotes alternative destinations while attacking Goa',
    weight: 0.15,
    check: (post) => {
      const text = post.originalText.toLowerCase();
      const competitorMentions = [
        'kerala', 'andaman', 'maldives', 'bali', 'thailand', 'sri lanka',
        'phuket', 'pondicherry', 'puducherry', 'gokarna', 'karwar',
      ];
      const negativeAboutGoa = post.sentiment < -0.3;
      const mentionsCompetitor = competitorMentions.some(dest => text.includes(dest));
      const promotionalLanguage = /\b(instead|better|go to|visit|choose|prefer)\b/i.test(text);

      return negativeAboutGoa && mentionsCompetitor && promotionalLanguage;
    },
  },
  {
    name: 'hashtag_spam',
    description: 'Excessive use of hashtags or call-to-action for virality',
    weight: 0.10,
    check: (post) => {
      const text = post.originalText;
      const hashtagCount = (text.match(/#\w+/g) ?? []).length;
      const hasViralCTA = /\b(retweet|share|make.?this.?viral|spread)\b/i.test(text);
      return hashtagCount > 5 || hasViralCTA;
    },
  },
  {
    name: 'no_engagement_history',
    description: 'Account has no positive engagement history with Goa content',
    weight: 0.05,
    check: (post) => {
      // Heuristic: if account has very few followers and no previous positive posts
      // In production, this would check actual engagement history
      return (post.authorFollowers ?? 0) < 20;
    },
  },
];

// --- Core Function ---

/**
 * Classify whether a complaint/negative post is genuine or manufactured.
 *
 * Uses heuristic signals including:
 * - Account characteristics (age, followers, naming patterns)
 * - Language patterns (generic vs specific, copy-paste indicators)
 * - Coordination detection (similar posts from different accounts)
 * - Competitive targeting (promoting alternatives)
 * - Engagement patterns (virality calls-to-action, hashtag spam)
 *
 * @param post - The post to classify
 * @returns Classification with manufactured flag, confidence, and detected signals
 */
export function classifyComplaint(post: SentimentDataPoint): ComplaintClassification {
  const detectedSignals: string[] = [];
  let totalWeight = 0;
  let triggeredWeight = 0;

  // Run all signal checks
  for (const signal of SIGNAL_CHECKS) {
    totalWeight += signal.weight;
    try {
      if (signal.check(post)) {
        detectedSignals.push(signal.description);
        triggeredWeight += signal.weight;
      }
    } catch {
      // Signal check failed — skip gracefully
    }
  }

  // Record this post for future coordination detection
  recordPost(post);

  // Calculate manufactured score
  const manufacturedScore = totalWeight > 0 ? triggeredWeight / totalWeight : 0;

  // Threshold: >0.4 triggered weight ratio = manufactured
  const isManufactured = manufacturedScore > 0.4;

  // Confidence is based on how many signals we could evaluate and how decisive the result is
  // Higher confidence when the score is clearly above or below the threshold
  const distanceFromThreshold = Math.abs(manufacturedScore - 0.4);
  const signalCoverage = detectedSignals.length > 0 ? Math.min(1, detectedSignals.length / 4) : 0.3;
  const confidence = clamp(
    0.3 + distanceFromThreshold * 0.5 + signalCoverage * 0.3,
    0.2,
    0.95
  );

  return {
    isManufactured,
    confidence: roundTo(confidence, 3),
    signals: detectedSignals,
  };
}

// --- Post Recording for Coordination Detection ---

function recordPost(post: SentimentDataPoint): void {
  recentPosts.push({
    author: post.author,
    text: post.originalText,
    timestamp: Date.now(),
    source: post.source,
    topics: post.topics,
  });

  // Prune old entries
  while (recentPosts.length > MAX_RECENT_POSTS) {
    recentPosts.shift();
  }
}

/**
 * Clear stored post records. Useful for testing.
 */
export function clearPostRecords(): void {
  recentPosts.length = 0;
}

/**
 * Get the number of tracked recent posts. Useful for monitoring.
 */
export function getTrackedPostCount(): number {
  return recentPosts.length;
}

// --- Utilities ---

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
