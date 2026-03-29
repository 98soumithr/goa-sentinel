-- ============================================================
-- Goa Sentinel — Production Database Schema
-- Run this in Supabase SQL Editor to set up all tables
-- ============================================================

-- ==============================
-- USERS & AUTH
-- ==============================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- ==============================
-- CORE DATA
-- ==============================

CREATE TABLE posts (
  id                TEXT PRIMARY KEY,
  source            TEXT NOT NULL CHECK (source IN ('reddit', 'news', 'google_reviews', 'tripadvisor')),
  timestamp         TIMESTAMPTZ NOT NULL,
  sentiment         REAL NOT NULL,
  magnitude         REAL NOT NULL,
  sentiment_label   TEXT NOT NULL CHECK (sentiment_label IN ('positive', 'negative', 'neutral')),
  language          TEXT NOT NULL DEFAULT 'en',
  original_text     TEXT NOT NULL,
  translated_text   TEXT,
  author            TEXT NOT NULL,
  author_followers  INTEGER,
  views             INTEGER DEFAULT 0,
  likes             INTEGER DEFAULT 0,
  shares            INTEGER DEFAULT 0,
  comments          INTEGER DEFAULT 0,
  topics            TEXT[] DEFAULT '{}',
  is_viral          BOOLEAN DEFAULT false,
  authenticity_score REAL DEFAULT 0.85,
  location          TEXT,
  url               TEXT,
  ai_model_used     TEXT,
  ai_processed_at   TIMESTAMPTZ,
  raw_ai_response   JSONB,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_timestamp ON posts(timestamp DESC);
CREATE INDEX idx_posts_source ON posts(source);
CREATE INDEX idx_posts_sentiment ON posts(sentiment);
CREATE INDEX idx_posts_source_timestamp ON posts(source, timestamp DESC);
CREATE INDEX idx_posts_is_viral ON posts(is_viral) WHERE is_viral = true;
CREATE INDEX idx_posts_topics ON posts USING GIN(topics);

-- ==============================
-- ALERTS
-- ==============================

CREATE TABLE alerts (
  id                TEXT PRIMARY KEY,
  type              TEXT NOT NULL CHECK (type IN ('viral_negative', 'coordinated_attack', 'trending_topic', 'sentiment_drop')),
  severity          TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  trigger_post_id   TEXT REFERENCES posts(id),
  risk_score        REAL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  acknowledged_at   TIMESTAMPTZ,
  acknowledged_by   UUID REFERENCES users(id),
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID REFERENCES users(id),
  resolution_notes  TEXT
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ==============================
-- COUNTER-NARRATIVES
-- ==============================

CREATE TABLE counter_narratives (
  id              TEXT PRIMARY KEY,
  alert_id        TEXT REFERENCES alerts(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('acknowledge_address', 'provide_context', 'redirect_positive')),
  text            TEXT NOT NULL,
  platform        TEXT NOT NULL,
  approved        BOOLEAN DEFAULT false,
  approved_by     UUID REFERENCES users(id),
  approved_at     TIMESTAMPTZ,
  ai_model_used   TEXT DEFAULT 'sonnet',
  generated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cn_alert ON counter_narratives(alert_id);

-- ==============================
-- NOTIFICATIONS
-- ==============================

CREATE TABLE notification_channels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL CHECK (channel IN ('telegram', 'email', 'whatsapp')),
  address     TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  min_severity TEXT DEFAULT 'high' CHECK (min_severity IN ('low', 'medium', 'high', 'critical')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        TEXT REFERENCES alerts(id),
  channel_id      UUID REFERENCES notification_channels(id),
  sent_at         TIMESTAMPTZ DEFAULT now(),
  status          TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  error_message   TEXT
);

-- ==============================
-- AGENT HEALTH & COLLECTION METADATA
-- ==============================

CREATE TABLE collection_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  posts_collected INTEGER DEFAULT 0,
  errors          TEXT[],
  duration_ms     INTEGER,
  rate_limit_remaining INTEGER,
  rate_limit_total     INTEGER
);

CREATE INDEX idx_collection_runs_source ON collection_runs(source, started_at DESC);

-- ==============================
-- SYSTEM CONFIGURATION
-- ==============================

CREATE TABLE system_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  updated_by  UUID REFERENCES users(id)
);

INSERT INTO system_config (key, value) VALUES
  ('alert_thresholds', '{"minRiskScore": 0.25, "minNegativeSentiment": -0.2, "viralViewThreshold": 10000}'),
  ('collection_schedule', '{"reddit": "*/15 * * * *", "news": "0 */2 * * *", "reviews": "0 */4 * * *"}'),
  ('ai_config', '{"sentimentModel": "anthropic/claude-haiku-4-20250514", "narrativeModel": "anthropic/claude-sonnet-4-20250514", "maxTokensSentiment": 200, "maxTokensNarrative": 1500}'),
  ('notification_config', '{"telegramBotToken": "", "sesFromEmail": "", "sesRegion": "ap-south-1"}');
