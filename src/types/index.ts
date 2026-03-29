// ============================================================
// Goa Sentinel — Core Type Definitions
// ============================================================

// --- Data Source Types ---
export type DataSource = 'reddit' | 'news' | 'google_reviews' | 'tripadvisor';

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export type AlertType = 'viral_negative' | 'coordinated_attack' | 'trending_topic' | 'sentiment_drop';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export type AgentStatus = 'idle' | 'running' | 'error' | 'rate_limited';

// --- Core Data Point ---
export interface SentimentDataPoint {
  id: string;
  source: DataSource;
  timestamp: Date;
  sentiment: number;           // -1.0 to 1.0
  magnitude: number;           // 0.0 to 1.0 (strength)
  sentimentLabel: SentimentLabel;
  language: string;            // ISO 639-1 code
  originalText: string;
  translatedText?: string;
  author: string;
  authorFollowers?: number;
  platformMetrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  topics: string[];
  isViral: boolean;
  authenticityScore: number;   // 0-1, higher = more genuine
  location?: string;
  url: string;
}

// --- Alert ---
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  triggerPost: SentimentDataPoint;
  generatedResponses?: CounterNarrative[];
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// --- Counter-Narrative ---
export interface CounterNarrative {
  id: string;
  type: 'acknowledge_address' | 'provide_context' | 'redirect_positive';
  text: string;
  platform: DataSource;
  approved: boolean;
  generatedAt: Date;
}

// --- Dashboard Snapshot ---
export interface DashboardSnapshot {
  overallSentiment: number;
  totalMentionsToday: number;
  mentionsTrend: number;       // % change from yesterday
  activeAlerts: number;
  criticalAlerts: number;
  topTrendingTopic: string;
  sentimentBySource: Record<DataSource, number>;
  sentimentByLanguage: Record<string, { score: number; percentage: number }>;
  hourlyTrend: Array<{
    hour: string;
    sentiment: number;
    volume: number;
  }>;
  recentPosts: SentimentDataPoint[];
  activeAlertsList: Alert[];
}

// --- Agent Health ---
export interface AgentHealth {
  name: string;
  source: DataSource;
  status: AgentStatus;
  lastRun: Date;
  postsCollected: number;
  errorsLast24h: number;
  avgResponseTime: number;
  rateLimit: {
    remaining: number;
    total: number;
    resetsAt: Date;
  };
}

// --- SSE Event Types ---
export type SSEEventType =
  | 'snapshot'
  | 'new_post'
  | 'sentiment_update'
  | 'alert'
  | 'agent_health'
  | 'trend_update';

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
  timestamp: Date;
}

// --- Viral Detection ---
export interface ViralMetrics {
  postId: string;
  velocityScore: number;
  acceleration: number;
  riskScore: number;
  isViral: boolean;
  alertLevel: 'green' | 'yellow' | 'orange' | 'red';
  projectedViews24h: number;
}

// --- Time Period ---
export type TimePeriod = 'day' | 'week' | 'month' | 'season' | 'year';

// --- Aggregated Sentiment ---
export interface SentimentAggregate {
  period: TimePeriod;
  periodStart: Date;
  source?: DataSource;
  language?: string;
  avgSentiment: number;
  postCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  topTopics: string[];
}
