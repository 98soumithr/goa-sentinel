// ============================================================
// Goa Sentinel — Database Seed Script
// Usage: npx tsx scripts/seed.ts
// ============================================================

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Load .env.local manually (no dotenv dependency needed) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Import real data ---
// We need to dynamically import the real-data module.
// Because it uses @/types path alias, we import the raw exports after
// registering the tsconfig paths. However, for simplicity in a seed script,
// we re-import with a relative path and let tsx handle the alias resolution.

async function loadRealData() {
  // tsx resolves tsconfig paths automatically
  const mod = await import('../src/mock-data/real-data');
  return {
    allRealData: mod.allRealData,
    realAlerts: mod.realAlerts,
  };
}

// --- Map SentimentDataPoint to posts table row ---
function mapPostToRow(post: any) {
  return {
    id: post.id,
    source: post.source,
    timestamp: post.timestamp instanceof Date ? post.timestamp.toISOString() : post.timestamp,
    sentiment: post.sentiment,
    magnitude: post.magnitude,
    sentiment_label: post.sentimentLabel,
    language: post.language,
    original_text: post.originalText,
    translated_text: post.translatedText ?? null,
    author: post.author,
    author_followers: post.authorFollowers ?? null,
    views: post.platformMetrics?.views ?? 0,
    likes: post.platformMetrics?.likes ?? 0,
    shares: post.platformMetrics?.shares ?? 0,
    comments: post.platformMetrics?.comments ?? 0,
    topics: post.topics,
    is_viral: post.isViral,
    authenticity_score: post.authenticityScore,
    location: post.location ?? null,
    url: post.url,
  };
}

// --- Map Alert to alerts table row ---
function mapAlertToRow(alert: any) {
  return {
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    status: alert.status,
    trigger_post_id: alert.triggerPost?.id ?? null,
    created_at: alert.createdAt instanceof Date ? alert.createdAt.toISOString() : alert.createdAt,
  };
}

// --- Map CounterNarrative to counter_narratives table row ---
function mapCounterNarrativeToRow(cn: any, alertId: string) {
  return {
    id: cn.id,
    alert_id: alertId,
    type: cn.type,
    text: cn.text,
    platform: cn.platform,
    approved: cn.approved,
    generated_at: cn.generatedAt instanceof Date ? cn.generatedAt.toISOString() : cn.generatedAt,
  };
}

// --- Seed admin user ---
async function seedAdminUser() {
  console.log('Seeding admin user...');

  const email = 'admin@goasentinel.gov.in';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 12);

  // Check if admin already exists in our custom users table
  const { data: existing } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existing) {
    console.log(`  Admin user ${email} already exists (id: ${existing.id}). Skipping.`);
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: hashedPassword,
      name: 'Admin',
      role: 'admin',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('  Error creating admin user:', error.message);
  } else {
    console.log(`  Admin user created: ${data.email} (id: ${data.id})`);
    console.log(`  Login: ${email} / ${password}`);
  }
}

// --- Seed posts ---
async function seedPosts(allRealData: any[]) {
  console.log(`Seeding ${allRealData.length} posts...`);

  const rows = allRealData.map(mapPostToRow);

  // Upsert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('posts')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`  Error inserting posts batch ${i / BATCH_SIZE + 1}:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`  Inserted/updated ${inserted} posts.`);
}

// --- Seed alerts and counter_narratives ---
async function seedAlerts(realAlerts: any[]) {
  console.log(`Seeding ${realAlerts.length} alerts...`);

  const alertRows = realAlerts.map(mapAlertToRow);

  const { error: alertError } = await supabase
    .from('alerts')
    .upsert(alertRows, { onConflict: 'id' });

  if (alertError) {
    console.error('  Error inserting alerts:', alertError.message);
  } else {
    console.log(`  Inserted/updated ${alertRows.length} alerts.`);
  }

  // Collect all counter_narratives from all alerts
  const counterNarrativeRows: any[] = [];
  for (const alert of realAlerts) {
    if (alert.generatedResponses && alert.generatedResponses.length > 0) {
      for (const cn of alert.generatedResponses) {
        counterNarrativeRows.push(mapCounterNarrativeToRow(cn, alert.id));
      }
    }
  }

  if (counterNarrativeRows.length > 0) {
    console.log(`Seeding ${counterNarrativeRows.length} counter narratives...`);

    const { error: cnError } = await supabase
      .from('counter_narratives')
      .upsert(counterNarrativeRows, { onConflict: 'id' });

    if (cnError) {
      console.error('  Error inserting counter_narratives:', cnError.message);
    } else {
      console.log(`  Inserted/updated ${counterNarrativeRows.length} counter narratives.`);
    }
  } else {
    console.log('  No counter narratives to seed.');
  }
}

// --- Main ---
async function main() {
  console.log('========================================');
  console.log('Goa Sentinel — Database Seed Script');
  console.log('========================================');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  try {
    // Load the real data
    const { allRealData, realAlerts } = await loadRealData();

    console.log(`Loaded ${allRealData.length} posts and ${realAlerts.length} alerts from real-data.ts`);
    console.log('');

    // Seed in order: posts first (alerts reference them via trigger_post_id)
    await seedPosts(allRealData);
    console.log('');

    await seedAlerts(realAlerts);
    console.log('');

    await seedAdminUser();
    console.log('');

    console.log('========================================');
    console.log('Seed complete!');
    console.log('========================================');
  } catch (err) {
    console.error('Seed script failed:', err);
    process.exit(1);
  }
}

main();
