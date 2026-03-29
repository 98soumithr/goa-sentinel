// ============================================================
// Goa Sentinel — Agent Orchestrator
// Manages the lifecycle of all data-collection agents.
// Uses an EventEmitter pattern for inter-agent communication.
// ============================================================

import { EventEmitter } from 'events';
import { AgentHealth, DataSource, SentimentDataPoint } from '@/types';
import { BaseAgent, CollectionResult } from './base-agent';
import { RedditAgent } from './reddit-agent';
import { NewsAgent } from './news-agent';
import { ReviewsAgent } from './reviews-agent';

// ---- Event types emitted by the orchestrator ----
export interface OrchestratorEvents {
  /** Fired when new data points arrive from any agent. */
  data: (posts: SentimentDataPoint[]) => void;
  /** Fired when an agent's health changes. */
  health: (health: AgentHealth) => void;
  /** Fired when an agent encounters an error. */
  error: (agentName: string, error: string) => void;
  /** Fired when a collection cycle completes across all agents. */
  cycle: (summary: CycleSummary) => void;
}

export interface CycleSummary {
  cycleNumber: number;
  timestamp: Date;
  totalPosts: number;
  postsBySource: Partial<Record<DataSource, number>>;
  errors: string[];
  durationMs: number;
}

/**
 * The Orchestrator manages all agents:
 * - Starts / stops the collection loop
 * - Monitors agent health
 * - Aggregates data from all agents into a unified stream
 * - Emits events for downstream consumers (API routes, SSE, etc.)
 */
export class Orchestrator extends EventEmitter {
  private agents: BaseAgent[] = [];
  private running = false;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private cycleCount = 0;

  /** In-memory buffer of the most recent posts (ring buffer, max 500). */
  private feedBuffer: SentimentDataPoint[] = [];
  private readonly maxFeedSize = 500;

  /** Default collection interval in ms. Prototype mode = 5s. */
  private readonly cycleIntervalMs: number;

  /** Default query string used for all agents. */
  private readonly defaultQuery: string;

  constructor(options?: {
    cycleIntervalMs?: number;
    query?: string;
    isPrototype?: boolean;
  }) {
    super();
    const isPrototype = options?.isPrototype ?? true;
    this.cycleIntervalMs = options?.cycleIntervalMs ?? (isPrototype ? 5000 : 60000);
    this.defaultQuery = options?.query ?? 'Goa tourism';

    // Instantiate all agents (4 active sources)
    this.agents = [
      new RedditAgent(isPrototype),
      new NewsAgent(isPrototype),
      new ReviewsAgent(isPrototype),
    ];
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  /**
   * Start all agents and begin the collection cycle.
   */
  start(): void {
    if (this.running) {
      console.warn('[Orchestrator] Already running — ignoring duplicate start()');
      return;
    }

    console.log(`[Orchestrator] Starting ${this.agents.length} agents — cycle every ${this.cycleIntervalMs}ms`);
    this.running = true;

    // Run the first cycle immediately
    this.runCycle();

    // Then schedule subsequent cycles
    this.cycleTimer = setInterval(() => {
      this.runCycle();
    }, this.cycleIntervalMs);
  }

  /**
   * Stop all agents and clear the collection timer.
   */
  stop(): void {
    if (!this.running) return;

    console.log('[Orchestrator] Stopping all agents');
    this.running = false;

    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  /**
   * Check whether the orchestrator is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  // ============================================================
  // Collection cycle
  // ============================================================

  /**
   * Run a single collection cycle across all agents in parallel.
   * Each agent is independent — one failing does not block others.
   */
  private async runCycle(): Promise<void> {
    const cycleStart = Date.now();
    this.cycleCount++;

    // Run all agents in parallel — errors are isolated per agent
    const results = await Promise.allSettled(
      this.agents.map((agent) => agent.runCycle(this.defaultQuery)),
    );

    const allPosts: SentimentDataPoint[] = [];
    const allErrors: string[] = [];
    const postsBySource: Partial<Record<DataSource, number>> = {};

    for (let i = 0; i < results.length; i++) {
      const agent = this.agents[i];
      const result = results[i];

      if (result.status === 'fulfilled') {
        const { data, errors } = result.value as CollectionResult;

        if (data.length > 0) {
          allPosts.push(...data);
          postsBySource[agent.source] = (postsBySource[agent.source] ?? 0) + data.length;
        }

        if (errors.length > 0) {
          allErrors.push(...errors);
          errors.forEach((err) => this.emit('error', agent.name, err));
        }
      } else {
        // Agent threw an unhandled error
        const errMsg = result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
        allErrors.push(`${agent.name}: UNHANDLED — ${errMsg}`);
        this.emit('error', agent.name, errMsg);
      }

      // Always emit health after each agent finishes
      this.emit('health', agent.getHealth());
    }

    // Add new posts to the ring buffer
    if (allPosts.length > 0) {
      this.addToFeed(allPosts);
      this.emit('data', allPosts);
    }

    // Emit cycle summary
    const summary: CycleSummary = {
      cycleNumber: this.cycleCount,
      timestamp: new Date(),
      totalPosts: allPosts.length,
      postsBySource,
      errors: allErrors,
      durationMs: Date.now() - cycleStart,
    };
    this.emit('cycle', summary);

    if (this.cycleCount % 10 === 0 || this.cycleCount === 1) {
      console.log(
        `[Orchestrator] Cycle #${summary.cycleNumber}: ${summary.totalPosts} posts, ${summary.errors.length} errors, ${summary.durationMs}ms`,
      );
    }
  }

  // ============================================================
  // Public queries
  // ============================================================

  /**
   * Get the health status of every agent.
   */
  getAgentStatuses(): AgentHealth[] {
    return this.agents.map((agent) => agent.getHealth());
  }

  /**
   * Get the aggregated feed (most recent posts).
   * Optionally filter by source.
   */
  getAggregatedFeed(options?: {
    source?: DataSource;
    limit?: number;
  }): SentimentDataPoint[] {
    let feed = [...this.feedBuffer];

    if (options?.source) {
      feed = feed.filter((p) => p.source === options.source);
    }

    // Most recent first
    feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const limit = options?.limit ?? 50;
    return feed.slice(0, limit);
  }

  /**
   * Get a summary of the current feed state.
   */
  getFeedSummary(): {
    totalPosts: number;
    postsBySource: Record<DataSource, number>;
    avgSentiment: number;
    cycleCount: number;
  } {
    const postsBySource: Record<DataSource, number> = {
      reddit: 0,
      news: 0,
      google_reviews: 0,
      tripadvisor: 0,
    };

    let sentimentSum = 0;
    for (const post of this.feedBuffer) {
      postsBySource[post.source]++;
      sentimentSum += post.sentiment;
    }

    return {
      totalPosts: this.feedBuffer.length,
      postsBySource,
      avgSentiment: this.feedBuffer.length > 0
        ? Math.round((sentimentSum / this.feedBuffer.length) * 100) / 100
        : 0,
      cycleCount: this.cycleCount,
    };
  }

  /**
   * Get the number of completed cycles.
   */
  getCycleCount(): number {
    return this.cycleCount;
  }

  /**
   * Get a specific agent by source.
   */
  getAgent(source: DataSource): BaseAgent | undefined {
    return this.agents.find((a) => a.source === source);
  }

  // ============================================================
  // Internal helpers
  // ============================================================

  /**
   * Add posts to the ring buffer, evicting oldest when full.
   */
  private addToFeed(posts: SentimentDataPoint[]): void {
    this.feedBuffer.push(...posts);

    // Trim to max size, keeping the most recent
    if (this.feedBuffer.length > this.maxFeedSize) {
      this.feedBuffer = this.feedBuffer.slice(
        this.feedBuffer.length - this.maxFeedSize,
      );
    }
  }
}

// ============================================================
// Singleton for app-wide access
// ============================================================

let orchestratorInstance: Orchestrator | null = null;

/**
 * Get or create the singleton orchestrator instance.
 * Safe to call multiple times — returns the same instance.
 */
export function getOrchestrator(options?: {
  cycleIntervalMs?: number;
  query?: string;
  isPrototype?: boolean;
}): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator(options);
  }
  return orchestratorInstance;
}

/**
 * Reset the singleton (used in tests or when reconfiguring).
 */
export function resetOrchestrator(): void {
  if (orchestratorInstance) {
    orchestratorInstance.stop();
    orchestratorInstance.removeAllListeners();
    orchestratorInstance = null;
  }
}
