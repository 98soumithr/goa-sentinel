// ============================================================
// Goa Sentinel — Base Agent (Abstract)
// All data collection agents extend this class.
// ============================================================

import {
  AgentHealth,
  AgentStatus,
  DataSource,
  SentimentDataPoint,
  SentimentLabel,
} from '@/types';
import { randomUUID } from 'crypto';

export interface RateLimit {
  remaining: number;
  total: number;
  resetsAt: Date;
}

export interface CollectionResult {
  data: SentimentDataPoint[];
  errors: string[];
  durationMs: number;
}

/**
 * Abstract base class for all data-collection agents.
 *
 * Responsibilities:
 * - Enforces a uniform collect → normalize → emit lifecycle.
 * - Tracks rate-limit state per agent.
 * - Exposes health metrics consumed by the orchestrator.
 * - Provides shared helpers (ID generation, sentiment labelling, etc.)
 */
export abstract class BaseAgent {
  // ---- Identity (set by each concrete agent) ----
  abstract readonly name: string;
  abstract readonly source: DataSource;

  // ---- State ----
  status: AgentStatus = 'idle';
  protected rateLimit: RateLimit;

  // ---- Metrics ----
  protected lastRun: Date = new Date(0);
  protected postsCollected: number = 0;
  protected errorsLast24h: number = 0;
  protected responseTimes: number[] = [];   // last 20 response-time samples
  protected errorTimestamps: Date[] = [];

  // ---- Prototype flag ----
  protected readonly isPrototype: boolean;

  constructor(
    rateLimitTotal: number,
    rateLimitWindowMs: number,
    isPrototype = true,
  ) {
    this.isPrototype = isPrototype;
    this.rateLimit = {
      remaining: rateLimitTotal,
      total: rateLimitTotal,
      resetsAt: new Date(Date.now() + rateLimitWindowMs),
    };
  }

  // ============================================================
  // Public API
  // ============================================================

  /**
   * Collect data for the given query string.
   * Each concrete agent implements its own collection strategy.
   */
  abstract collect(query: string): Promise<SentimentDataPoint[]>;

  /**
   * Run a full collection cycle with error isolation and metrics tracking.
   */
  async runCycle(query: string): Promise<CollectionResult> {
    const start = Date.now();
    const errors: string[] = [];
    let data: SentimentDataPoint[] = [];

    try {
      this.status = 'running';
      this.handleRateLimit();

      // handleRateLimit() may have mutated this.status — cast to avoid TS narrowing issue
      if ((this.status as AgentStatus) === 'rate_limited') {
        errors.push(`${this.name}: rate-limited until ${this.rateLimit.resetsAt.toISOString()}`);
        return { data: [], errors, durationMs: Date.now() - start };
      }

      data = await this.collect(query);
      this.postsCollected += data.length;
      this.rateLimit.remaining = Math.max(0, this.rateLimit.remaining - 1);
      this.status = 'idle';
    } catch (err) {
      this.status = 'error';
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${this.name}: ${message}`);
      this.recordError();
    }

    const durationMs = Date.now() - start;
    this.lastRun = new Date();
    this.recordResponseTime(durationMs);

    return { data, errors, durationMs };
  }

  /**
   * Return a health snapshot for the orchestrator / dashboard.
   */
  getHealth(): AgentHealth {
    this.pruneOldErrors();
    return {
      name: this.name,
      source: this.source,
      status: this.status,
      lastRun: this.lastRun,
      postsCollected: this.postsCollected,
      errorsLast24h: this.errorTimestamps.length,
      avgResponseTime: this.avgResponseTime(),
      rateLimit: { ...this.rateLimit },
    };
  }

  // ============================================================
  // Protected helpers (available to concrete agents)
  // ============================================================

  /**
   * Normalize a raw data blob into a fully-typed SentimentDataPoint.
   * Concrete agents can override for source-specific mapping; this
   * default handles the common prototype-mode shape.
   */
  protected normalize(rawData: Record<string, unknown>): SentimentDataPoint {
    const sentiment = (rawData.sentiment as number) ?? 0;
    return {
      id: (rawData.id as string) ?? this.generateId(),
      source: this.source,
      timestamp: rawData.timestamp instanceof Date
        ? rawData.timestamp
        : new Date((rawData.timestamp as string) ?? Date.now()),
      sentiment,
      magnitude: (rawData.magnitude as number) ?? Math.abs(sentiment),
      sentimentLabel: this.labelFromScore(sentiment),
      language: (rawData.language as string) ?? 'en',
      originalText: (rawData.originalText as string) ?? '',
      translatedText: rawData.translatedText as string | undefined,
      author: (rawData.author as string) ?? 'unknown',
      authorFollowers: rawData.authorFollowers as number | undefined,
      platformMetrics: (rawData.platformMetrics as SentimentDataPoint['platformMetrics']) ?? {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
      },
      topics: (rawData.topics as string[]) ?? [],
      isViral: (rawData.isViral as boolean) ?? false,
      authenticityScore: (rawData.authenticityScore as number) ?? 0.85,
      location: rawData.location as string | undefined,
      url: (rawData.url as string) ?? '',
    };
  }

  /**
   * Check and update rate-limit state.
   * If the window has elapsed, reset. If exhausted, mark status.
   */
  protected handleRateLimit(): void {
    const now = new Date();
    if (now >= this.rateLimit.resetsAt) {
      // Window has elapsed — reset the counter
      this.rateLimit.remaining = this.rateLimit.total;
      this.rateLimit.resetsAt = new Date(
        now.getTime() + this.getRateLimitWindowMs(),
      );
      if (this.status === 'rate_limited') {
        this.status = 'idle';
      }
    }

    if (this.rateLimit.remaining <= 0) {
      this.status = 'rate_limited';
    }
  }

  /** Override in subclass if the window differs from the default (15 min). */
  protected getRateLimitWindowMs(): number {
    return 15 * 60 * 1000; // 15 minutes
  }

  // ============================================================
  // Utility helpers
  // ============================================================

  protected generateId(): string {
    return `${this.source}_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }

  protected labelFromScore(score: number): SentimentLabel {
    if (score >= 0.15) return 'positive';
    if (score <= -0.15) return 'negative';
    return 'neutral';
  }

  /** Pick a random element from an array. */
  protected pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /** Generate a random number in [min, max]. */
  protected rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /** Generate a random integer in [min, max]. */
  protected randInt(min: number, max: number): number {
    return Math.floor(this.rand(min, max + 1));
  }

  // ---- Internal bookkeeping ----

  private recordResponseTime(ms: number): void {
    this.responseTimes.push(ms);
    if (this.responseTimes.length > 20) this.responseTimes.shift();
  }

  private avgResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  private recordError(): void {
    this.errorTimestamps.push(new Date());
    this.errorsLast24h = this.errorTimestamps.length;
  }

  private pruneOldErrors(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.errorTimestamps = this.errorTimestamps.filter(
      (t) => t.getTime() > oneDayAgo,
    );
    this.errorsLast24h = this.errorTimestamps.length;
  }
}
