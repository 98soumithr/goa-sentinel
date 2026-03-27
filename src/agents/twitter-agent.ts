// ============================================================
// Goa Sentinel — Twitter/X Agent
// Monitors tweets matching Goa tourism keywords.
// ============================================================

import { DataSource, SentimentDataPoint } from '@/types';
import { BaseAgent } from './base-agent';

// TODO: Import real Twitter API v2 client when moving to Phase 2
// import { Client as TwitterClient } from 'twitter-api-sdk';

/** Keywords we search for across Twitter/X. */
const GOA_KEYWORDS = [
  'Goa tourism',
  'Goa travel',
  'Goa beach',
  'Goa nightlife',
  'Goa holiday',
  'Goa vacation',
  '#GoaTourism',
  '#VisitGoa',
  '#GoaBeaches',
  '#GoaTravel',
  '#GoaIndia',
  'Goa scam',
  'Goa safety',
  'Goa overpriced',
  'Goa dirty',
  'Goa infrastructure',
];

/** Sample tweet templates for prototype mode. */
const MOCK_TWEETS = {
  positive: [
    'Just landed in Goa and the vibes are immaculate! Best decision ever #GoaTravel',
    'Shout out to the Goa tourism team - the Dudhsagar falls experience was flawless!',
    'Goa sunsets never disappoint. Third visit this year and every time feels like the first',
    'The food scene in Goa has levelled up insanely. Every restaurant is a gem',
    'Palolem beach at sunrise is genuinely one of the most beautiful sights in India',
    'Goa beach shacks have the best vibe, seafood was incredible',
    'Exploring the churches and heritage of Old Goa, stunning architecture',
    'The water sports at Baga were so well organized. Felt very safe.',
    'Goa has the best spice plantations, learned so much about cardamom and pepper!',
    'Stayed at a heritage villa in Fontainhas - the Portuguese architecture is beautiful',
  ],
  negative: [
    'Goa taxi mafia is out of control. Charged 3x normal rate from airport.',
    'The beach in Calangute was filthy today. Plastic everywhere. Tourism minister do something!',
    'Got food poisoning at a shack in Baga. Zero hygiene standards.',
    'Goa roads are a death trap. Potholes everywhere and no street lights.',
    'Paid ₹5000 for a "luxury" hotel that had mold on the walls. Goa hospitality is a joke.',
    'Water cuts in the middle of tourist season? Goa infrastructure is crumbling.',
    'Scammed by a travel agent in Goa. Booked tours that didn\'t exist.',
    'Noise pollution in North Goa is unbearable. Can\'t sleep past midnight.',
  ],
  neutral: [
    'Planning a trip to Goa next month. Any recommendations for South Goa?',
    'Goa weather forecast shows rain this weekend. Pack umbrellas!',
    'Comparing Goa vs Kerala for December trip. Thoughts?',
    'Just saw the new Goa airport terminal. Looks modern.',
    'Goa population has grown 5% in the last census, interesting stats.',
    'Flight prices to Goa have dropped for midweek dates.',
  ],
};

const MOCK_AUTHORS = [
  { name: '@travelguru_india', followers: 45200 },
  { name: '@beachbum_vibes', followers: 12300 },
  { name: '@goa_explorer', followers: 8700 },
  { name: '@wanderlust_jay', followers: 150400 },
  { name: '@backpackindia', followers: 67800 },
  { name: '@tourist_rant', followers: 3200 },
  { name: '@incredibleindia_fan', followers: 22100 },
  { name: '@solo_travel_riya', followers: 31400 },
  { name: '@goan_foodie', followers: 9800 },
  { name: '@digital_nomad_dk', followers: 56700 },
];

const LANGUAGES = [
  { code: 'en', weight: 0.40 },
  { code: 'hi', weight: 0.25 },
  { code: 'mr', weight: 0.10 },
  { code: 'ru', weight: 0.08 },
  { code: 'de', weight: 0.05 },
  { code: 'ko', weight: 0.04 },
  { code: 'pt', weight: 0.04 },
  { code: 'fr', weight: 0.04 },
];

export class TwitterAgent extends BaseAgent {
  readonly name = 'Twitter/X Agent';
  readonly source: DataSource = 'twitter';

  // TODO: Store real API client reference
  // private client: TwitterClient | null = null;

  constructor(isPrototype = true) {
    // Twitter API v2: 300 requests per 15-minute window
    super(300, 15 * 60 * 1000, isPrototype);
  }

  // ============================================================
  // Collection
  // ============================================================

  async collect(query: string): Promise<SentimentDataPoint[]> {
    if (this.isPrototype) {
      return this.collectMock(query);
    }

    // TODO: Phase 2 — Real Twitter API v2 integration
    // return this.collectReal(query);
    return this.collectMock(query);
  }

  // ============================================================
  // Mock collection (prototype mode)
  // ============================================================

  private async collectMock(_query: string): Promise<SentimentDataPoint[]> {
    // Simulate network delay (50-200ms)
    await new Promise((r) => setTimeout(r, this.randInt(50, 200)));

    const count = this.randInt(1, 4); // 1-4 tweets per cycle
    const posts: SentimentDataPoint[] = [];

    for (let i = 0; i < count; i++) {
      posts.push(this.generateMockTweet());
    }

    return posts;
  }

  private generateMockTweet(): SentimentDataPoint {
    // Weighted sentiment distribution: 55% positive, 15% negative, 30% neutral
    const roll = Math.random();
    let sentimentBucket: 'positive' | 'negative' | 'neutral';
    if (roll < 0.55) sentimentBucket = 'positive';
    else if (roll < 0.70) sentimentBucket = 'negative';
    else sentimentBucket = 'neutral';

    const text = this.pick(MOCK_TWEETS[sentimentBucket]);
    const author = this.pick(MOCK_AUTHORS);
    const lang = this.pickWeightedLanguage();

    const sentimentScore =
      sentimentBucket === 'positive'
        ? this.rand(0.2, 0.95)
        : sentimentBucket === 'negative'
          ? this.rand(-0.95, -0.2)
          : this.rand(-0.14, 0.14);

    const views = this.randInt(100, 80000);
    const isViral = views > 10000;
    const likes = Math.floor(views * this.rand(0.02, 0.15));
    const shares = Math.floor(likes * this.rand(0.1, 0.4));
    const comments = Math.floor(likes * this.rand(0.05, 0.25));

    return this.normalize({
      id: this.generateId(),
      source: this.source,
      timestamp: new Date(Date.now() - this.randInt(0, 300) * 1000), // up to 5 min ago
      sentiment: Math.round(sentimentScore * 100) / 100,
      magnitude: Math.round(Math.abs(sentimentScore) * 100) / 100,
      language: lang,
      originalText: text,
      translatedText: lang !== 'en' ? text : undefined, // In real mode, this would be an actual translation
      author: author.name,
      authorFollowers: author.followers,
      platformMetrics: { views, likes, shares, comments },
      topics: this.extractTopics(text),
      isViral,
      authenticityScore: this.rand(0.6, 1.0),
      location: this.pick(['Panaji', 'Calangute', 'Baga', 'Palolem', 'Anjuna', 'Vagator', 'Margao', undefined]),
      url: `https://x.com/${author.name.replace('@', '')}/status/${Date.now()}${this.randInt(1000, 9999)}`,
    });
  }

  private extractTopics(text: string): string[] {
    const topicMap: Record<string, string[]> = {
      beach: ['beaches', 'coastal'],
      food: ['food', 'cuisine', 'dining'],
      nightlife: ['nightlife', 'entertainment'],
      taxi: ['transport', 'taxi', 'infrastructure'],
      hotel: ['accommodation', 'hospitality'],
      safety: ['safety', 'security'],
      scam: ['safety', 'scam'],
      heritage: ['heritage', 'culture'],
      water: ['water sports', 'adventure'],
      airport: ['infrastructure', 'transport'],
    };

    const topics = new Set<string>();
    const lower = text.toLowerCase();
    for (const [keyword, tags] of Object.entries(topicMap)) {
      if (lower.includes(keyword)) {
        tags.forEach((t) => topics.add(t));
      }
    }
    if (topics.size === 0) topics.add('general');
    return Array.from(topics);
  }

  private pickWeightedLanguage(): string {
    const roll = Math.random();
    let cumulative = 0;
    for (const lang of LANGUAGES) {
      cumulative += lang.weight;
      if (roll <= cumulative) return lang.code;
    }
    return 'en';
  }

  // ============================================================
  // Real collection (Phase 2 placeholder)
  // ============================================================

  // TODO: Phase 2 — Uncomment and implement when Twitter API keys are available
  //
  // private async collectReal(query: string): Promise<SentimentDataPoint[]> {
  //   if (!this.client) {
  //     this.client = new TwitterClient(process.env.TWITTER_BEARER_TOKEN!);
  //   }
  //
  //   const searchTerms = GOA_KEYWORDS.join(' OR ');
  //   const response = await this.client.tweets.tweetsRecentSearch({
  //     query: `(${searchTerms}) -is:retweet lang:en`,
  //     max_results: 100,
  //     'tweet.fields': [
  //       'created_at', 'author_id', 'public_metrics', 'lang', 'geo',
  //     ],
  //     'user.fields': ['username', 'public_metrics'],
  //     expansions: ['author_id'],
  //   });
  //
  //   return (response.data ?? []).map((tweet) =>
  //     this.normalize({
  //       id: `twitter_${tweet.id}`,
  //       timestamp: new Date(tweet.created_at!),
  //       originalText: tweet.text,
  //       language: tweet.lang ?? 'en',
  //       // ... map remaining fields
  //     }),
  //   );
  // }

  protected getRateLimitWindowMs(): number {
    return 15 * 60 * 1000; // 15 minutes
  }
}
