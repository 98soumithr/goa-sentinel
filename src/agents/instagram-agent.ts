// ============================================================
// Goa Sentinel — Instagram Agent
// Monitors hashtags: #goa, #goatravel, #goabeaches
// ============================================================

import { DataSource, SentimentDataPoint } from '@/types';
import { BaseAgent } from './base-agent';

// TODO: Import Instagram Graph API client when moving to Phase 2
// import { IgApiClient } from 'instagram-private-api';

/** Hashtags we track on Instagram. */
const TRACKED_HASHTAGS = [
  '#goa',
  '#goatravel',
  '#goabeaches',
  '#goavibes',
  '#goaindia',
  '#goalife',
  '#northgoa',
  '#southgoa',
  '#goafood',
  '#goanightlife',
];

/** Mock Instagram caption templates. */
const MOCK_CAPTIONS = {
  positive: [
    'Golden hour at Palolem never gets old 🌅 #goa #goabeaches #sunset',
    'This is what paradise looks like. Morjim beach, zero crowds, pure bliss. #goatravel #beachlife',
    'The best vindaloo I\'ve ever had. Goan cuisine hits different when you\'re actually in Goa. #goafood #foodie',
    'Exploring the spice plantations of Goa. The colors and aromas are unreal! #goaindia #travel',
    'Woke up to this view. South Goa is a whole different mood. #goavibes #southgoa #luxury',
    'Portuguese architecture in Panaji is giving Europe on a budget vibes. #goalife #heritage',
    'Kayaking through the mangroves in Goa. Nature at its finest! #goatravel #adventure',
    'Night market in Arpora was magical. So many unique finds. #northgoa #goalife',
  ],
  negative: [
    'Not the Goa I was promised. Beach covered in litter and plastic. Do better. #goa #disappointed',
    'Waited 2 hours for a taxi that never came. Goa transport is a nightmare. #goatravel #scam',
    '₹500 for a regular coconut water on the beach?? The tourist tax in Goa is insane. #goa #overpriced',
    'Stray dogs everywhere on Anjuna beach. Felt unsafe walking at night. #goa #safety',
    'Hotel room looked nothing like the photos. Goa hospitality needs a reality check. #goabeaches #fail',
  ],
  neutral: [
    'Day 3 in Goa. Exploring churches and temples today. #goaindia #culture',
    'Packing for Goa next week. What should I bring? Comment below! #goatravel',
    'Goa airport arrival. New terminal is huge. Let\'s see what this trip has in store. #goa',
    'Renting a scooter in Goa - the way to go or risky? Share your experience. #goatravel #tips',
    'Market day in Mapusa. Locals say this is where the real Goa is. #goalife #authentic',
  ],
};

const MOCK_AUTHORS = [
  { handle: '@travelwithluxe', followers: 120000 },
  { handle: '@goabeachdiaries', followers: 45000 },
  { handle: '@indiantravelblogger', followers: 280000 },
  { handle: '@digitalnomad.goa', followers: 18000 },
  { handle: '@solofemaleindia', followers: 92000 },
  { handle: '@sunseeker_raj', followers: 8500 },
  { handle: '@goafoodie', followers: 35000 },
  { handle: '@photographer.goa', followers: 67000 },
  { handle: '@wanderlust.priya', followers: 150000 },
  { handle: '@coastalvibes_', followers: 22000 },
];

export class InstagramAgent extends BaseAgent {
  readonly name = 'Instagram Agent';
  readonly source: DataSource = 'instagram';

  // TODO: Store real Instagram API client reference
  // private client: IgApiClient | null = null;

  constructor(isPrototype = true) {
    // Instagram Graph API: 200 requests per hour
    super(200, 60 * 60 * 1000, isPrototype);
  }

  // ============================================================
  // Collection
  // ============================================================

  async collect(query: string): Promise<SentimentDataPoint[]> {
    if (this.isPrototype) {
      return this.collectMock(query);
    }

    // TODO: Phase 2 — Real Instagram Graph API integration
    // return this.collectReal(query);
    return this.collectMock(query);
  }

  // ============================================================
  // Mock collection (prototype mode)
  // ============================================================

  private async collectMock(_query: string): Promise<SentimentDataPoint[]> {
    // Simulate network delay (100-300ms)
    await new Promise((r) => setTimeout(r, this.randInt(100, 300)));

    const count = this.randInt(1, 3); // 1-3 posts per cycle
    const posts: SentimentDataPoint[] = [];

    for (let i = 0; i < count; i++) {
      posts.push(this.generateMockPost());
    }

    return posts;
  }

  private generateMockPost(): SentimentDataPoint {
    // Instagram skews more positive: 65% positive, 10% negative, 25% neutral
    const roll = Math.random();
    let sentimentBucket: 'positive' | 'negative' | 'neutral';
    if (roll < 0.65) sentimentBucket = 'positive';
    else if (roll < 0.75) sentimentBucket = 'negative';
    else sentimentBucket = 'neutral';

    const caption = this.pick(MOCK_CAPTIONS[sentimentBucket]);
    const author = this.pick(MOCK_AUTHORS);
    const hashtag = this.pick(TRACKED_HASHTAGS);

    const sentimentScore =
      sentimentBucket === 'positive'
        ? this.rand(0.20, 0.95)
        : sentimentBucket === 'negative'
          ? this.rand(-0.85, -0.15)
          : this.rand(-0.14, 0.14);

    // Instagram posts tend to have higher engagement
    const likes = this.randInt(50, 25000);
    const comments = Math.floor(likes * this.rand(0.02, 0.12));
    const views = likes * this.randInt(3, 10); // Reels/stories get more views
    const shares = Math.floor(likes * this.rand(0.01, 0.08));
    const isViral = views > 10000;

    return this.normalize({
      id: this.generateId(),
      source: this.source,
      timestamp: new Date(Date.now() - this.randInt(0, 900) * 1000), // up to 15 min ago
      sentiment: Math.round(sentimentScore * 100) / 100,
      magnitude: Math.round(Math.abs(sentimentScore) * 100) / 100,
      language: this.pickLanguage(),
      originalText: caption,
      author: author.handle,
      authorFollowers: author.followers,
      platformMetrics: { views, likes, shares, comments },
      topics: this.extractTopics(caption, hashtag),
      isViral,
      authenticityScore: this.rand(0.50, 0.95), // Instagram has more curated/sponsored content
      location: this.pick([
        'Palolem Beach', 'Baga Beach', 'Anjuna', 'Vagator',
        'Panaji', 'Calangute', 'Morjim', 'Arambol',
        'Dudhsagar Falls', 'Old Goa', undefined,
      ]),
      url: `https://instagram.com/p/${this.generateShortcode()}`,
    });
  }

  private extractTopics(text: string, hashtag: string): string[] {
    const topics = new Set<string>();
    const lower = text.toLowerCase();

    const topicMap: Record<string, string[]> = {
      beach: ['beaches', 'coastal'],
      food: ['food', 'cuisine'],
      sunset: ['nature', 'photography'],
      nightlife: ['nightlife', 'entertainment'],
      heritage: ['heritage', 'culture'],
      church: ['heritage', 'culture', 'religion'],
      temple: ['heritage', 'culture', 'religion'],
      market: ['shopping', 'culture'],
      hotel: ['accommodation'],
      taxi: ['transport'],
      scam: ['safety', 'scam'],
      dirty: ['cleanliness', 'environment'],
      litter: ['cleanliness', 'environment'],
      plastic: ['cleanliness', 'environment'],
      spice: ['food', 'culture', 'nature'],
      kayak: ['adventure', 'water sports'],
      scooter: ['transport', 'adventure'],
    };

    for (const [keyword, tags] of Object.entries(topicMap)) {
      if (lower.includes(keyword)) {
        tags.forEach((t) => topics.add(t));
      }
    }

    // Add hashtag as topic
    topics.add(hashtag.replace('#', ''));
    if (topics.size === 1) topics.add('general');
    return Array.from(topics);
  }

  private pickLanguage(): string {
    // Instagram in Goa has a more international audience
    const roll = Math.random();
    if (roll < 0.50) return 'en';
    if (roll < 0.65) return 'hi';
    if (roll < 0.75) return 'ru';
    if (roll < 0.82) return 'de';
    if (roll < 0.88) return 'fr';
    if (roll < 0.93) return 'ko';
    if (roll < 0.97) return 'pt';
    return 'ja';
  }

  private generateShortcode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let code = '';
    for (let i = 0; i < 11; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  protected getRateLimitWindowMs(): number {
    return 60 * 60 * 1000; // 1 hour
  }

  // ============================================================
  // Real collection (Phase 2 placeholder)
  // ============================================================

  // TODO: Phase 2 — Uncomment and implement when Instagram API access is available
  //
  // private async collectReal(query: string): Promise<SentimentDataPoint[]> {
  //   // Instagram Graph API requires a Business/Creator account
  //   // and approved app with instagram_basic and instagram_manage_insights
  //   //
  //   // const response = await fetch(
  //   //   `https://graph.instagram.com/ig_hashtag_search?q=${hashtag}&user_id=${userId}&access_token=${token}`
  //   // );
  //   //
  //   // For each hashtag in TRACKED_HASHTAGS:
  //   //   1. Get hashtag ID via ig_hashtag_search
  //   //   2. Fetch recent media via /{hashtag-id}/recent_media
  //   //   3. Normalize each post into SentimentDataPoint
  //   //
  //   // Note: Instagram API has strict rate limits and requires
  //   //       business account approval. Consider using CrowdTangle
  //   //       for more comprehensive monitoring.
  //   //
  //   return [];
  // }
}
