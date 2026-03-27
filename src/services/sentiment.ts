// ============================================================
// Goa Sentinel — Sentiment Analysis Service
// ============================================================
// Prototype: keyword-based scoring with weighted word lists.
// TODO: Replace with Claude API integration for production:
//   - Use Claude Haiku for fast, cheap sentiment scoring
//   - Use Claude Sonnet for nuanced multilingual analysis
//   - Prompt: "Score the sentiment of this text about Goa tourism
//     on a scale of -1 (extremely negative) to 1 (extremely positive).
//     Return JSON: { score, label, magnitude, confidence }"
// ============================================================

import type { SentimentLabel } from '@/types';

// --- Weighted Word Lists ---

interface WeightedWord {
  word: string;
  weight: number; // positive weight = positive sentiment, negative = negative
}

const ENGLISH_POSITIVE: WeightedWord[] = [
  // Strong positive (0.6-1.0)
  { word: 'amazing', weight: 0.8 },
  { word: 'incredible', weight: 0.8 },
  { word: 'excellent', weight: 0.9 },
  { word: 'outstanding', weight: 0.9 },
  { word: 'paradise', weight: 0.85 },
  { word: 'breathtaking', weight: 0.85 },
  { word: 'wonderful', weight: 0.8 },
  { word: 'fantastic', weight: 0.8 },
  { word: 'perfect', weight: 0.9 },
  { word: 'spectacular', weight: 0.85 },
  { word: 'magical', weight: 0.8 },
  { word: 'unforgettable', weight: 0.85 },
  // Moderate positive (0.3-0.6)
  { word: 'beautiful', weight: 0.6 },
  { word: 'lovely', weight: 0.55 },
  { word: 'great', weight: 0.5 },
  { word: 'good', weight: 0.4 },
  { word: 'nice', weight: 0.35 },
  { word: 'clean', weight: 0.45 },
  { word: 'friendly', weight: 0.5 },
  { word: 'welcoming', weight: 0.55 },
  { word: 'safe', weight: 0.5 },
  { word: 'peaceful', weight: 0.55 },
  { word: 'relaxing', weight: 0.5 },
  { word: 'enjoyable', weight: 0.5 },
  { word: 'delicious', weight: 0.55 },
  { word: 'recommend', weight: 0.5 },
  { word: 'love', weight: 0.6 },
  { word: 'loved', weight: 0.6 },
  { word: 'charming', weight: 0.5 },
  { word: 'vibrant', weight: 0.5 },
  { word: 'scenic', weight: 0.55 },
  { word: 'pristine', weight: 0.6 },
  // Mild positive (0.1-0.3)
  { word: 'decent', weight: 0.2 },
  { word: 'okay', weight: 0.15 },
  { word: 'fine', weight: 0.15 },
  { word: 'pleasant', weight: 0.3 },
  { word: 'satisfactory', weight: 0.25 },
  { word: 'comfortable', weight: 0.3 },
];

const ENGLISH_NEGATIVE: WeightedWord[] = [
  // Strong negative (-0.6 to -1.0)
  { word: 'terrible', weight: -0.85 },
  { word: 'horrible', weight: -0.85 },
  { word: 'disgusting', weight: -0.9 },
  { word: 'awful', weight: -0.8 },
  { word: 'worst', weight: -0.9 },
  { word: 'dangerous', weight: -0.85 },
  { word: 'scam', weight: -0.8 },
  { word: 'fraud', weight: -0.85 },
  { word: 'nightmare', weight: -0.85 },
  { word: 'unsafe', weight: -0.8 },
  { word: 'avoid', weight: -0.7 },
  { word: 'ruined', weight: -0.75 },
  { word: 'destroyed', weight: -0.8 },
  { word: 'harassment', weight: -0.9 },
  { word: 'assault', weight: -0.95 },
  { word: 'death', weight: -0.9 },
  { word: 'killed', weight: -0.95 },
  // Moderate negative (-0.3 to -0.6)
  { word: 'dirty', weight: -0.55 },
  { word: 'overpriced', weight: -0.5 },
  { word: 'crowded', weight: -0.4 },
  { word: 'rude', weight: -0.55 },
  { word: 'disappointing', weight: -0.5 },
  { word: 'poor', weight: -0.45 },
  { word: 'bad', weight: -0.5 },
  { word: 'waste', weight: -0.5 },
  { word: 'pollution', weight: -0.55 },
  { word: 'garbage', weight: -0.55 },
  { word: 'trash', weight: -0.5 },
  { word: 'noisy', weight: -0.35 },
  { word: 'unfriendly', weight: -0.5 },
  { word: 'robbery', weight: -0.7 },
  { word: 'theft', weight: -0.65 },
  { word: 'stolen', weight: -0.6 },
  { word: 'overrated', weight: -0.45 },
  { word: 'tourist trap', weight: -0.55 },
  // Mild negative (-0.1 to -0.3)
  { word: 'mediocre', weight: -0.25 },
  { word: 'average', weight: -0.15 },
  { word: 'slow', weight: -0.2 },
  { word: 'boring', weight: -0.3 },
  { word: 'expensive', weight: -0.25 },
  { word: 'long wait', weight: -0.2 },
];

const HINDI_POSITIVE: WeightedWord[] = [
  { word: 'बहुत अच्छा', weight: 0.7 },
  { word: 'शानदार', weight: 0.8 },
  { word: 'बेहतरीन', weight: 0.85 },
  { word: 'सुंदर', weight: 0.6 },
  { word: 'खूबसूरत', weight: 0.65 },
  { word: 'मजेदार', weight: 0.55 },
  { word: 'अद्भुत', weight: 0.8 },
  { word: 'अच्छा', weight: 0.4 },
  { word: 'स्वादिष्ट', weight: 0.55 },
  { word: 'साफ', weight: 0.45 },
  { word: 'सुरक्षित', weight: 0.5 },
  { word: 'शांत', weight: 0.5 },
  { word: 'मस्त', weight: 0.5 },
  { word: 'जबरदस्त', weight: 0.7 },
  { word: 'लाजवाब', weight: 0.75 },
  { word: 'कमाल', weight: 0.7 },
];

const HINDI_NEGATIVE: WeightedWord[] = [
  { word: 'बहुत बुरा', weight: -0.75 },
  { word: 'गंदा', weight: -0.55 },
  { word: 'खराब', weight: -0.5 },
  { word: 'बकवास', weight: -0.6 },
  { word: 'बेकार', weight: -0.55 },
  { word: 'महंगा', weight: -0.3 },
  { word: 'खतरनाक', weight: -0.8 },
  { word: 'धोखा', weight: -0.75 },
  { word: 'लूट', weight: -0.7 },
  { word: 'गंदगी', weight: -0.6 },
  { word: 'प्रदूषण', weight: -0.55 },
  { word: 'असुरक्षित', weight: -0.7 },
  { word: 'भीड़', weight: -0.35 },
  { word: 'निराश', weight: -0.5 },
  { word: 'बदतमीज', weight: -0.6 },
  { word: 'घटिया', weight: -0.65 },
];

// --- Negation handling ---

const NEGATION_WORDS = new Set([
  'not', 'no', "n't", 'never', 'neither', 'nor', 'hardly', 'barely',
  'dont', "don't", 'doesnt', "doesn't", 'didnt', "didn't",
  'wasnt', "wasn't", 'werent', "weren't", 'isnt', "isn't",
  'wont', "won't", 'wouldnt', "wouldn't", 'couldnt', "couldn't",
  'shouldnt', "shouldn't", 'cant', "can't", 'cannot',
  'नहीं', 'मत', 'ना', 'बिल्कुल नहीं',
]);

// --- Intensifier handling ---

const INTENSIFIERS: Record<string, number> = {
  'very': 1.3,
  'extremely': 1.5,
  'incredibly': 1.5,
  'absolutely': 1.4,
  'totally': 1.3,
  'really': 1.2,
  'so': 1.2,
  'quite': 1.1,
  'pretty': 1.1,
  'somewhat': 0.8,
  'slightly': 0.7,
  'a bit': 0.7,
  'बहुत': 1.3,
  'बिल्कुल': 1.4,
  'काफी': 1.2,
  'थोड़ा': 0.7,
};

// --- Goa-specific context boosters ---

const GOA_CONTEXT_BOOSTERS: Record<string, number> = {
  // Positive Goa associations
  'beach cleanup': 0.3,
  'heritage': 0.2,
  'carnival': 0.2,
  'susegad': 0.25,
  'feni': 0.15,
  'old goa': 0.15,
  'basilica': 0.15,
  'dudhsagar': 0.2,
  'palolem': 0.15,
  'fish curry rice': 0.15,
  // Negative Goa associations
  'drug': -0.3,
  'rave': -0.2,
  'illegal construction': -0.35,
  'deforestation': -0.3,
  'water shortage': -0.25,
  'taxi mafia': -0.4,
  'beach shack violation': -0.3,
  'mining': -0.2,
  'casinos': -0.15,
};

// --- Core Analysis Function ---

export interface SentimentResult {
  score: number;
  label: SentimentLabel;
  magnitude: number;
  confidence: number;
}

/**
 * Analyze the sentiment of a given text.
 *
 * Prototype implementation uses keyword-based scoring with weighted words,
 * negation detection, intensifier handling, and Goa-specific context boosters.
 *
 * @param text - The text to analyze
 * @param language - ISO 639-1 language code (e.g., 'en', 'hi')
 * @returns SentimentResult with score, label, magnitude, and confidence
 */
export function analyzeSentiment(text: string, language: string): SentimentResult {
  const lowerText = text.toLowerCase();
  const words = tokenize(lowerText);

  // Select word lists based on language
  const positiveWords = language === 'hi'
    ? [...ENGLISH_POSITIVE, ...HINDI_POSITIVE]
    : ENGLISH_POSITIVE;
  const negativeWords = language === 'hi'
    ? [...ENGLISH_NEGATIVE, ...HINDI_NEGATIVE]
    : ENGLISH_NEGATIVE;

  let totalScore = 0;
  let matchCount = 0;
  let maxAbsWeight = 0;

  // Score individual words and multi-word phrases
  const allWords = [...positiveWords, ...negativeWords];

  for (const { word, weight } of allWords) {
    const occurrences = countOccurrences(lowerText, word);
    if (occurrences > 0) {
      let effectiveWeight = weight;

      // Check for negation in proximity (within 3 words before the match)
      if (isNegated(lowerText, word)) {
        effectiveWeight *= -0.75; // Flip and reduce (negation doesn't fully reverse)
      }

      // Check for intensifiers in proximity
      const intensifier = findIntensifier(lowerText, word);
      if (intensifier > 0) {
        effectiveWeight *= intensifier;
      }

      // Diminishing returns for repeated words
      const effectiveOccurrences = 1 + Math.log2(occurrences);

      totalScore += effectiveWeight * effectiveOccurrences;
      matchCount += occurrences;
      maxAbsWeight = Math.max(maxAbsWeight, Math.abs(effectiveWeight));
    }
  }

  // Apply Goa-specific context boosters
  for (const [phrase, boost] of Object.entries(GOA_CONTEXT_BOOSTERS)) {
    if (lowerText.includes(phrase)) {
      totalScore += boost;
      matchCount += 1;
    }
  }

  // Normalize score to [-1, 1] range
  const rawScore = matchCount > 0 ? totalScore / (matchCount * 0.6) : 0;
  const score = clamp(rawScore, -1, 1);

  // Determine label
  const label = scoreToLabel(score);

  // Calculate magnitude (strength of sentiment, 0-1)
  // Based on how extreme the score is and how many matches we found
  const magnitude = clamp(
    Math.abs(score) * Math.min(1, matchCount / 3),
    0,
    1
  );

  // Confidence based on:
  // - Number of sentiment-bearing words found
  // - Text length (longer text = potentially more context)
  // - Presence of strong signal words
  const wordCountFactor = Math.min(1, matchCount / 5);
  const lengthFactor = Math.min(1, words.length / 10);
  const strongSignalFactor = maxAbsWeight > 0.6 ? 0.2 : 0;
  const confidence = clamp(
    0.3 + (wordCountFactor * 0.3) + (lengthFactor * 0.2) + strongSignalFactor,
    0.1,
    0.95
  );

  return { score: roundTo(score, 3), label, magnitude: roundTo(magnitude, 3), confidence: roundTo(confidence, 3) };
}

// --- Helper Functions ---

function tokenize(text: string): string[] {
  return text
    .replace(/[^\w\s\u0900-\u097F]/g, ' ') // Keep alphanumeric, spaces, and Devanagari
    .split(/\s+/)
    .filter(Boolean);
}

function countOccurrences(text: string, phrase: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = text.indexOf(phrase, pos)) !== -1) {
    // Check word boundaries for single words (not multi-word phrases)
    if (!phrase.includes(' ')) {
      const before = pos > 0 ? text[pos - 1] : ' ';
      const after = pos + phrase.length < text.length ? text[pos + phrase.length] : ' ';
      if (/\w/.test(before) || /\w/.test(after)) {
        pos += 1;
        continue;
      }
    }
    count++;
    pos += phrase.length;
  }
  return count;
}

function isNegated(text: string, word: string): boolean {
  const idx = text.indexOf(word);
  if (idx === -1) return false;

  // Look at 40 characters before the word for negation
  const prefix = text.substring(Math.max(0, idx - 40), idx).trim();
  const prefixWords = prefix.split(/\s+/);
  const lastFew = prefixWords.slice(-3);

  return lastFew.some(w => NEGATION_WORDS.has(w));
}

function findIntensifier(text: string, word: string): number {
  const idx = text.indexOf(word);
  if (idx === -1) return 0;

  const prefix = text.substring(Math.max(0, idx - 30), idx).trim();

  for (const [intensifier, multiplier] of Object.entries(INTENSIFIERS)) {
    if (prefix.endsWith(intensifier) || prefix.includes(intensifier + ' ')) {
      return multiplier;
    }
  }

  return 0;
}

function scoreToLabel(score: number): SentimentLabel {
  if (score > 0.1) return 'positive';
  if (score < -0.1) return 'negative';
  return 'neutral';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
