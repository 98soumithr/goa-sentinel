import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for browser/public access (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  { auth: { persistSession: false } }
);

// ============================================================
// Database helper types matching our schema
// ============================================================

export interface DbPost {
  id: string;
  source: string;
  timestamp: string;
  sentiment: number;
  magnitude: number;
  sentiment_label: string;
  language: string;
  original_text: string;
  translated_text: string | null;
  author: string;
  author_followers: number | null;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  topics: string[];
  is_viral: boolean;
  authenticity_score: number;
  location: string | null;
  url: string | null;
  ai_model_used: string | null;
  ai_processed_at: string | null;
  raw_ai_response: Record<string, unknown> | null;
  created_at: string;
}

export interface DbAlert {
  id: string;
  type: string;
  severity: string;
  status: string;
  trigger_post_id: string | null;
  risk_score: number | null;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
}

export interface DbCounterNarrative {
  id: string;
  alert_id: string;
  type: string;
  text: string;
  platform: string;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  ai_model_used: string;
  generated_at: string;
}

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: "admin" | "analyst" | "viewer";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface DbCollectionRun {
  id: string;
  source: string;
  started_at: string;
  completed_at: string | null;
  posts_collected: number;
  errors: string[] | null;
  duration_ms: number | null;
  rate_limit_remaining: number | null;
  rate_limit_total: number | null;
}
