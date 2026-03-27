// ============================================================
// Goa Sentinel — Counter-Narrative Generation Service
// ============================================================
// Prototype: Template-based response generation.
// TODO: Replace with Claude API for production:
//   - Use Claude Sonnet for nuanced, context-aware responses
//   - Prompt structure:
//     "You are a Goa tourism communications specialist.
//      A negative post about Goa is going viral. Generate 3 response
//      options: (1) Acknowledge & Address, (2) Provide Context with data,
//      (3) Redirect to positives. Use real statistics where possible.
//      Post: {post.originalText}
//      Platform: {post.source}
//      Current sentiment: {post.sentiment}
//      Topics: {post.topics}"
//   - Use Claude Haiku for quick drafts, Sonnet for final polish
// ============================================================

import type { SentimentDataPoint, AlertType, CounterNarrative, DataSource } from '@/types';

// --- Template Bank ---
// Each template category has variants for different alert types and topics.
// Placeholders: {{topic}}, {{platform}}, {{stat}}, {{source}}

interface TemplateEntry {
  type: CounterNarrative['type'];
  templates: string[];
  applicableAlertTypes: AlertType[];
  applicableTopics?: string[]; // If empty, applies to all topics
}

const TEMPLATE_BANK: TemplateEntry[] = [
  // =====================
  // ACKNOWLEDGE & ADDRESS
  // =====================
  {
    type: 'acknowledge_address',
    applicableAlertTypes: ['viral_negative', 'sentiment_drop'],
    templates: [
      "We hear the concerns about {{topic}} in Goa. The Department of Tourism takes every report seriously. Our team is actively investigating and will share updates. If you've had a negative experience, please DM us directly — we want to make it right.",
      "Thank you for raising this issue about {{topic}}. We acknowledge the concern and want you to know that Goa's tourism authorities are working on it. We've already initiated {{action}} to address this. Your feedback helps us improve.",
      "We understand the frustration regarding {{topic}}. This is not the Goa experience we strive to deliver. Our rapid response team has been deployed and we expect resolution within {{timeframe}}. We appreciate your patience.",
    ],
  },
  {
    type: 'acknowledge_address',
    applicableAlertTypes: ['coordinated_attack'],
    templates: [
      "We're aware of the circulating claims about {{topic}} in Goa. We want to address this directly with verified facts. {{fact}}. We encourage everyone to check official sources before sharing unverified reports.",
      "There are some claims going around about {{topic}} that we'd like to address. Here are the verified facts: {{fact}}. We remain committed to transparency and welcome genuine feedback from visitors.",
    ],
  },

  // ================
  // PROVIDE CONTEXT
  // ================
  {
    type: 'provide_context',
    applicableAlertTypes: ['viral_negative', 'sentiment_drop', 'coordinated_attack'],
    applicableTopics: ['safety', 'crime', 'dangerous', 'unsafe'],
    templates: [
      "For context: Goa's crime rate against tourists dropped 23% in 2024-25. We have 24/7 tourist police helpline (1800-233-7333), beach lifeguard coverage at all major beaches, and CCTV monitoring across tourist zones. Safety is our top priority.",
      "Important context: Goa has one of the lowest crime rates among Indian tourist destinations. In 2024, we expanded our Tourist Police force by 40% and installed emergency SOS pillars at 50+ beach locations. Your safety matters to us.",
      "Let's look at the numbers: Goa welcomed 9.5 million tourists in 2024 with a 96.2% positive experience rating (Tourism Dept survey). Isolated incidents, while unacceptable, don't represent the reality of visiting Goa.",
    ],
  },
  {
    type: 'provide_context',
    applicableAlertTypes: ['viral_negative', 'sentiment_drop', 'coordinated_attack'],
    applicableTopics: ['dirty', 'pollution', 'garbage', 'trash', 'clean', 'waste'],
    templates: [
      "Goa has invested ₹250 crore in the Swachh Goa initiative since 2023. Beach cleanup drives run daily at 30+ beaches. Our Blue Flag certified beaches (Palolem, Galgibaga, Miramar) maintain international cleanliness standards. We're committed to keeping Goa pristine.",
      "Context on cleanliness: Goa's beach monitoring program deploys 500+ sanitation workers daily. In 2024, we removed 12,000+ tonnes of waste through regular cleanup drives. Three of our beaches hold international Blue Flag certification. We're constantly improving.",
      "Facts: Goa's Waste Management Corporation processes 95% of tourist-zone waste within 24 hours. We've banned single-use plastics in all coastal areas since 2023 and run daily mechanized beach cleaning at 40 locations.",
    ],
  },
  {
    type: 'provide_context',
    applicableAlertTypes: ['viral_negative', 'sentiment_drop', 'coordinated_attack'],
    applicableTopics: ['overpriced', 'expensive', 'scam', 'taxi', 'transport'],
    templates: [
      "Goa has introduced regulated taxi meters and the GoaMiles app for transparent pricing. The Tourism Department publishes official rate cards for all tourist services. If you encounter overcharging, report it on our helpline: 1800-233-7333. Action is taken within 24 hours.",
      "We hear concerns about pricing. Here's what we've done: Official rate cards at all entry points, GoaMiles app for fair metered rides, price regulation for water sports activities, and a tourist complaint redressal system with 48-hour resolution guarantee.",
    ],
  },
  {
    type: 'provide_context',
    applicableAlertTypes: ['viral_negative', 'trending_topic', 'sentiment_drop'],
    templates: [
      "For context on {{topic}}: Goa's tourism infrastructure has seen ₹1,200 crore in upgrades over the past 2 years. This includes improved road networks, public facilities, and digital services for visitors. We're building a better experience every day.",
      "Some perspective: Goa ranks #1 among Indian states in the Sustainable Tourism Index 2024. With 9.5 million visitors in 2024 (up 15% YoY), we're continuously scaling our infrastructure to match demand while preserving our unique culture.",
    ],
  },

  // ===================
  // REDIRECT POSITIVE
  // ===================
  {
    type: 'redirect_positive',
    applicableAlertTypes: ['viral_negative', 'sentiment_drop', 'trending_topic'],
    templates: [
      "While we address this, here's what makes Goa special: 105km of pristine coastline, UNESCO World Heritage churches, a food scene rated among Asia's top 10, and the warmest hospitality in India. Over 95% of our visitors plan to return. Come see for yourself! 🌊",
      "Goa is so much more than any single incident. From the spice plantations of Ponda to the Portuguese heritage of Fontainhas, from world-class diving at Grande Island to the tranquil backwaters of Chapora — there's a reason 9.5 million people chose Goa last year.",
      "Did you know? Goa was named 'Best Emerging Destination' by Travel + Leisure India 2024. With new eco-tourism trails, heritage walks, and farm-to-table dining experiences launching every month, there's never been a better time to experience Goa.",
    ],
  },
  {
    type: 'redirect_positive',
    applicableAlertTypes: ['coordinated_attack'],
    templates: [
      "We invite everyone to experience the real Goa. Talk to recent visitors, check verified reviews on Google and TripAdvisor (4.5★ average across 50K+ reviews), or follow our official channels for authentic updates. The truth is in the experience.",
      "Rather than rely on unverified claims, we encourage you to hear from the millions who visit Goa every year. Our visitor satisfaction rate stands at 96.2%. Browse #MyGoaExperience for real stories from real travelers.",
    ],
  },
];

// --- Platform-Specific Formatting ---

const PLATFORM_CHAR_LIMITS: Record<DataSource, number> = {
  twitter: 280,
  reddit: 10000,
  instagram: 2200,
  news: 5000,
  google_reviews: 4000,
  tripadvisor: 4000,
};

const PLATFORM_HASHTAGS: Record<DataSource, string[]> = {
  twitter: ['#Goa', '#GoaTourism', '#IncredibleIndia'],
  instagram: ['#Goa', '#GoaTourism', '#GoaVibes', '#IncredibleIndia', '#ExploreGoa'],
  reddit: [], // Reddit doesn't use hashtags
  news: [],
  google_reviews: [],
  tripadvisor: [],
};

// --- Counter Variable Banks (for template substitution) ---

const ACTIONS: string[] = [
  'a special task force review',
  'an inter-departmental coordination meeting',
  'enhanced monitoring at the affected location',
  'direct engagement with local stakeholders',
  'an expedited inquiry through our rapid response cell',
];

const TIMEFRAMES: string[] = [
  '48 hours',
  '72 hours',
  'this week',
  'the next few days',
];

const FACTS: string[] = [
  'Goa\'s tourist satisfaction rate was 96.2% in the latest Tourism Department survey',
  'Goa has 24/7 tourist police coverage with response times under 15 minutes',
  'Independent audits confirm Goa\'s water quality meets international swimming standards at 85% of monitored beaches',
  'The Tourism Department resolved 94% of formal complaints within 48 hours in 2024',
  'Goa\'s tourism sector provides employment to 350,000+ locals, making it the backbone of the state economy',
];

// --- Core Function ---

/**
 * Generate counter-narrative responses for a flagged post.
 *
 * Returns 3 response options:
 *   1. Acknowledge & Address — empathetic, takes responsibility
 *   2. Provide Context — data-backed, factual correction
 *   3. Redirect Positive — shifts attention to Goa's strengths
 *
 * @param post - The flagged post to respond to
 * @param alertType - The type of alert triggered
 * @returns Array of 3 CounterNarrative options
 */
export async function generateCounterNarrative(
  post: SentimentDataPoint,
  alertType: AlertType
): Promise<CounterNarrative[]> {
  // TODO: Replace this entire function body with Claude API call:
  // const response = await anthropic.messages.create({
  //   model: 'claude-sonnet-4-20250514',
  //   max_tokens: 1500,
  //   messages: [{ role: 'user', content: buildPrompt(post, alertType) }],
  // });
  // return parseClaudeResponse(response);

  const narratives: CounterNarrative[] = [];
  const types: CounterNarrative['type'][] = ['acknowledge_address', 'provide_context', 'redirect_positive'];

  for (const type of types) {
    const template = selectTemplate(type, alertType, post.topics);
    const filledText = fillTemplate(template, post);
    const formattedText = formatForPlatform(filledText, post.source);

    narratives.push({
      id: generateId(),
      type,
      text: formattedText,
      platform: post.source,
      approved: false,
      generatedAt: new Date(),
    });
  }

  return narratives;
}

// --- Template Selection ---

function selectTemplate(
  type: CounterNarrative['type'],
  alertType: AlertType,
  topics: string[]
): string {
  // Find templates matching the type and alert type
  const candidates = TEMPLATE_BANK.filter(entry => {
    if (entry.type !== type) return false;
    if (!entry.applicableAlertTypes.includes(alertType)) return false;

    // If template has topic restrictions, check for match
    if (entry.applicableTopics && entry.applicableTopics.length > 0) {
      const normalizedTopics = topics.map(t => t.toLowerCase());
      const hasTopicMatch = entry.applicableTopics.some(t =>
        normalizedTopics.some(nt => nt.includes(t) || t.includes(nt))
      );
      if (!hasTopicMatch) return false;
    }

    return true;
  });

  // If no topic-specific match, fall back to generic templates for this type
  const pool = candidates.length > 0
    ? candidates
    : TEMPLATE_BANK.filter(e => e.type === type && !e.applicableTopics);

  if (pool.length === 0) {
    // Ultimate fallback
    return "We are aware of concerns about {{topic}} in Goa and are actively working to address them. Your feedback is valued and helps us improve the Goa tourism experience.";
  }

  // Pick a random template from the best matching entry
  const entry = pool[Math.floor(Math.random() * pool.length)];
  return entry.templates[Math.floor(Math.random() * entry.templates.length)];
}

// --- Template Filling ---

function fillTemplate(template: string, post: SentimentDataPoint): string {
  const primaryTopic = post.topics[0] ?? 'tourism concerns';

  let text = template;
  text = text.replace(/\{\{topic\}\}/g, primaryTopic);
  text = text.replace(/\{\{platform\}\}/g, post.source);
  text = text.replace(/\{\{action\}\}/g, randomPick(ACTIONS));
  text = text.replace(/\{\{timeframe\}\}/g, randomPick(TIMEFRAMES));
  text = text.replace(/\{\{fact\}\}/g, randomPick(FACTS));

  return text;
}

// --- Platform Formatting ---

function formatForPlatform(text: string, platform: DataSource): string {
  const charLimit = PLATFORM_CHAR_LIMITS[platform];
  const hashtags = PLATFORM_HASHTAGS[platform];

  let formatted = text;

  // Add hashtags if platform supports them and there's room
  if (hashtags.length > 0) {
    const hashtagStr = '\n\n' + hashtags.join(' ');
    if (formatted.length + hashtagStr.length <= charLimit) {
      formatted += hashtagStr;
    }
  }

  // Truncate if over limit
  if (formatted.length > charLimit) {
    formatted = formatted.substring(0, charLimit - 3) + '...';
  }

  return formatted;
}

// --- Utilities ---

function generateId(): string {
  return `cn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
