// ============================================================
// Goa Sentinel — Real Data Builder
// Takes scraped raw data and converts it to SentimentDataPoint[]
// Run: npx tsx scripts/build-real-data.ts
// ============================================================

import { writeFileSync } from 'fs';
import { resolve } from 'path';

// Simple keyword-based sentiment scorer for real data
function scoreSentiment(text: string): { score: number; magnitude: number; label: 'positive' | 'negative' | 'neutral' } {
  const lower = text.toLowerCase();

  const positiveWords = [
    'beautiful', 'amazing', 'love', 'loved', 'great', 'excellent', 'wonderful',
    'fantastic', 'paradise', 'stunning', 'perfect', 'best', 'incredible', 'awesome',
    'breathtaking', 'pristine', 'clean', 'friendly', 'delicious', 'recommended',
    'worth', 'enjoy', 'enjoyed', 'happy', 'impressed', 'superb', 'magical',
    'peaceful', 'relaxing', 'charming', 'vibrant', 'memorable', 'scenic',
    'growth', 'boost', 'record', 'success', 'improve', 'development',
    'initiative', 'welcomed', 'praised', 'achievement', 'safe', 'thriving',
    'acche', 'bahut', 'mast', 'zabardast', 'sundar', // Hindi positive
  ];

  const negativeWords = [
    'dirty', 'terrible', 'worst', 'awful', 'disappointed', 'disappointing',
    'overpriced', 'scam', 'rude', 'unsafe', 'dangerous', 'disgusting',
    'horrible', 'avoid', 'waste', 'crowded', 'noisy', 'polluted', 'garbage',
    'trash', 'harassment', 'harassed', 'tourist trap', 'ripoff', 'rip-off',
    'poor', 'bad', 'stink', 'filthy', 'complaint', 'warning', 'beware',
    'aggressive', 'overrated', 'mess', 'chaos', 'crime', 'theft', 'stolen',
    'drug', 'drugs', 'accident', 'death', 'drown', 'drowning',
    'kharab', 'ganda', 'bura', // Hindi negative
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) positiveCount += matches.length;
  }

  for (const word of negativeWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) negativeCount += matches.length;
  }

  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { score: 0.05, magnitude: 0.2, label: 'neutral' };
  }

  const raw = (positiveCount - negativeCount) / total;
  const score = Math.round(raw * 1000) / 1000;
  const magnitude = Math.round(Math.min(total / 10, 1.0) * 1000) / 1000;

  let label: 'positive' | 'negative' | 'neutral';
  if (score > 0.15) label = 'positive';
  else if (score < -0.15) label = 'negative';
  else label = 'neutral';

  return { score, magnitude, label };
}

// Detect language from text (simple heuristic)
function detectLanguage(text: string): string {
  const hindiRegex = /[\u0900-\u097F]/;
  const russianRegex = /[\u0400-\u04FF]/;
  const arabicRegex = /[\u0600-\u06FF]/;
  const chineseRegex = /[\u4E00-\u9FFF]/;

  if (hindiRegex.test(text)) return 'hi';
  if (russianRegex.test(text)) return 'ru';
  if (arabicRegex.test(text)) return 'ar';
  if (chineseRegex.test(text)) return 'zh';
  return 'en';
}

// Extract topics from text
function extractTopics(text: string): string[] {
  const lower = text.toLowerCase();
  const topicMap: Record<string, string[]> = {
    beaches: ['beach', 'sand', 'surf', 'swim', 'coast', 'shore', 'palolem', 'baga', 'calangute', 'anjuna', 'vagator', 'morjim', 'candolim', 'arambol'],
    nightlife: ['club', 'party', 'night', 'bar', 'pub', 'tito', 'cubana', 'casino', 'dj', 'rave', 'music'],
    food: ['food', 'restaurant', 'eat', 'cuisine', 'fish', 'seafood', 'thali', 'vindaloo', 'feni', 'cafe', 'shack'],
    heritage: ['church', 'temple', 'fort', 'museum', 'heritage', 'portuguese', 'old goa', 'fontainhas', 'history'],
    safety: ['safe', 'unsafe', 'crime', 'scam', 'police', 'harassment', 'drug', 'accident', 'drown'],
    transport: ['taxi', 'bus', 'rent', 'bike', 'scooter', 'airport', 'train', 'uber', 'ola', 'transport'],
    hotels: ['hotel', 'hostel', 'resort', 'stay', 'airbnb', 'accommodation', 'room', 'booking'],
    weather: ['rain', 'weather', 'monsoon', 'hot', 'humid', 'season', 'summer', 'winter'],
    prices: ['price', 'expensive', 'cheap', 'cost', 'budget', 'money', 'overpriced', 'afford'],
    culture: ['culture', 'festival', 'carnival', 'local', 'people', 'community', 'tradition', 'goan'],
  };

  const found: string[] = [];
  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some(k => lower.includes(k))) {
      found.push(topic);
    }
  }

  return found.length > 0 ? found.slice(0, 3) : ['tourism'];
}

console.log('Real data builder ready. Import scraped data and call buildRealData().');

export { scoreSentiment, detectLanguage, extractTopics };
