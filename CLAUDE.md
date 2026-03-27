# Goa Sentinel — Reputation Defence & Tourist Sentiment Command Centre

## Project Overview
Real-time AI agent system that monitors every mention of Goa tourism across Twitter/X, Instagram, Reddit, Google Reviews, TripAdvisor, and news in 15+ languages — and takes action automatically.

**Target User:** Minister Rohan Khaunte (Goa Tourism Minister) and his office.

## Core Features
1. **Real-time Monitoring** — Track mentions across 6+ platforms in 15+ languages
2. **Viral Detection** — Alert when posts reach >10K views, within minutes
3. **Sentiment Scoring** — Live dashboard with scores by week/month/season
4. **Auto Counter-Narratives** — AI-generated data-backed responses for social team
5. **Complaint Classification** — Real vs manufactured/competitive flagging
6. **Minister Dashboard** — Clean, executive-level UI with KPIs

## Architecture

### Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router) + TypeScript | Streaming, RSC, SSE |
| UI Components | Tremor + Tailwind CSS + shadcn/ui | Dashboard-optimized |
| Charts | Apache ECharts (`echarts-for-react`) | Time series, heatmaps, gauges |
| Real-time | Server-Sent Events (SSE) | Unidirectional, auto-reconnect |
| Backend | Next.js API Routes + BullMQ Workers | Unified codebase |
| Job Queue | BullMQ (Redis-backed) | Rate limiting, retries |
| Database | PostgreSQL (+ TimescaleDB for prod) | Time-series + relational |
| Cache | Redis | Pub/sub + caching + BullMQ |
| AI/Sentiment | Claude API (Haiku for speed, Sonnet for depth) | Multilingual understanding |
| Translation | Built-in Claude multilingual | 15+ languages natively |

### Multi-Agent Architecture (Parallel Processing)
```
                     ┌─── Twitter Agent ────┐
                     ├─── Reddit Agent  ────┤
  Orchestrator ─────>├─── Instagram Agent ──┤──> Analysis Pipeline ──> Dashboard
                     ├─── News Agent     ───┤
                     ├─── Reviews Agent  ───┤
                     └─── TripAdvisor Agent─┘
```

Each agent runs as an independent BullMQ worker with:
- Own rate limiting per API
- Normalized output schema
- Error isolation (one agent failing doesn't crash others)
- Health monitoring

### Data Pipeline
```
Ingestion → Normalization → Translation → Sentiment Analysis → Alert Detection → Storage → Dashboard
```

### Prototype Strategy
**Phase 1 (Current):** Mock data with realistic patterns — daily cycles, trending spikes, sentiment shifts
**Phase 2:** Connect real APIs one at a time
**Phase 3:** Production with full AI pipeline

## File Structure
```
goa-sentinel/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/
│   │   │   ├── stream/         # SSE endpoint for real-time updates
│   │   │   ├── snapshot/       # Initial data load API
│   │   │   ├── alerts/         # Alert management API
│   │   │   └── counter-narrative/ # AI response generation API
│   │   ├── dashboard/          # Dashboard pages
│   │   │   ├── page.tsx        # Main dashboard
│   │   │   └── components/     # Dashboard-specific components
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing/redirect
│   ├── agents/                 # Data collection agents
│   │   ├── base-agent.ts       # Abstract base for all agents
│   │   ├── twitter-agent.ts    # X/Twitter monitoring
│   │   ├── reddit-agent.ts     # Reddit monitoring
│   │   ├── instagram-agent.ts  # Instagram monitoring
│   │   ├── news-agent.ts       # News aggregation
│   │   ├── reviews-agent.ts    # Google Reviews + TripAdvisor
│   │   └── orchestrator.ts     # Agent lifecycle manager
│   ├── services/               # Business logic
│   │   ├── sentiment.ts        # Sentiment analysis service
│   │   ├── viral-detection.ts  # Trend/viral detection algorithms
│   │   ├── counter-narrative.ts # AI response generation
│   │   ├── complaint-classifier.ts # Real vs fake detection
│   │   └── alert-manager.ts    # Alert rules and notifications
│   ├── lib/                    # Shared utilities
│   │   ├── redis.ts            # Redis client
│   │   ├── db.ts               # Database client
│   │   ├── queue.ts            # BullMQ queue setup
│   │   └── sse.ts              # SSE helpers
│   ├── types/                  # TypeScript types
│   │   └── index.ts            # Shared type definitions
│   ├── config/                 # Configuration
│   │   └── index.ts            # Environment + feature flags
│   └── mock-data/              # Realistic mock data generators
│       ├── generator.ts        # Main mock data engine
│       ├── scenarios.ts        # Pre-built demo scenarios
│       └── seed-data.ts        # Static seed content
├── tests/                      # Test files
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── config/                     # External configs
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.example
```

## Coding Standards

### Agent Development
- Every agent MUST extend `BaseAgent` class
- Agents communicate ONLY through BullMQ queues — no direct imports
- Each agent handles its own rate limiting
- Normalize all data to `SentimentDataPoint` type before emitting

### Dashboard Development
- Server Components for initial data load
- Client Components ONLY for interactive/real-time elements
- SSE for live updates (NOT WebSocket — simpler, auto-reconnect)
- ECharts for all visualizations
- Tremor for layout primitives (cards, KPIs, stat blocks)

### Data Schema
```typescript
interface SentimentDataPoint {
  id: string;
  source: 'twitter' | 'reddit' | 'instagram' | 'news' | 'google_reviews' | 'tripadvisor';
  timestamp: Date;
  sentiment: number;        // -1.0 to 1.0
  magnitude: number;        // 0.0 to 1.0 (strength of sentiment)
  language: string;          // ISO 639-1 code
  originalText: string;
  translatedText?: string;   // English translation if non-English
  author: string;
  platform_metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
  topics: string[];
  is_viral: boolean;         // >10K views threshold
  authenticity_score: number; // 0-1, higher = more likely genuine
  location?: string;
  url: string;
}

interface Alert {
  id: string;
  type: 'viral_negative' | 'coordinated_attack' | 'trending_topic' | 'sentiment_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  trigger_post: SentimentDataPoint;
  generated_response?: string;  // AI counter-narrative
  created_at: Date;
  acknowledged: boolean;
}

interface DashboardSnapshot {
  overall_sentiment: number;
  total_mentions_today: number;
  mentions_trend: number;     // % change from yesterday
  active_alerts: number;
  top_trending_topic: string;
  sentiment_by_source: Record<string, number>;
  sentiment_by_language: Record<string, number>;
  hourly_trend: Array<{ hour: string; sentiment: number; volume: number }>;
}
```

### Mock Data Requirements
- Daily cycle patterns (activity peaks mid-day, drops at night)
- Realistic sentiment distribution (slightly positive baseline ~0.3)
- Language distribution: English 35%, Hindi 20%, Konkani 15%, Russian 10%, German 5%, Others 15%
- Occasional viral spikes and sentiment drops
- Pre-built demo scenario showing: normal → negative viral event → counter-narrative → recovery

## API Keys Needed (Phase 2+)
- `ANTHROPIC_API_KEY` — Claude API for sentiment + counter-narratives
- `TWITTER_BEARER_TOKEN` — X API v2
- `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` — Reddit API
- `GOOGLE_PLACES_API_KEY` — Google Reviews
- `NEWS_API_KEY` — NewsAPI.org
- `REDIS_URL` — Redis connection
- `DATABASE_URL` — PostgreSQL connection

## Development Commands
```bash
npm run dev          # Start Next.js dev server
npm run agents       # Start BullMQ agent workers
npm run mock         # Generate mock data stream
npm run seed         # Seed database with demo data
npm run test         # Run tests
npm run build        # Production build
```

## Demo Script (For Minister Presentation)
1. Open dashboard — show overall positive sentiment gauge
2. Point out real-time data flowing in from 6 platforms
3. Show language breakdown — "we monitor in 15+ languages"
4. Trigger simulated viral negative post — watch alert appear within seconds
5. Show auto-generated counter-narrative with data points
6. Show the complaint classified as "manufactured" with evidence markers
7. Zoom into weekly/monthly trend — show seasonal patterns
8. Show the alert that would go to the minister's phone

## Performance Targets
- Dashboard first paint: <2 seconds
- SSE update latency: <200ms
- Alert generation: <30 seconds from detection
- Counter-narrative draft: <60 seconds
- Mock data refresh rate: Every 3 seconds
