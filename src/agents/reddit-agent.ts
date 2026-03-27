// ============================================================
// Goa Sentinel — Reddit Agent
// Monitors subreddits: r/goa, r/india, r/travel, r/solotravel
// ============================================================

import { DataSource, SentimentDataPoint } from '@/types';
import { BaseAgent } from './base-agent';

// TODO: Import real Reddit API client (snoowrap) when moving to Phase 2
// import Snoowrap from 'snoowrap';

/** Target subreddits to monitor. */
const SUBREDDITS = ['r/goa', 'r/india', 'r/travel', 'r/solotravel'];

/** Flair tags used in r/goa and r/india. */
const FLAIRS = ['Tourism', 'Travel', 'Help', 'Discussion', 'Rant', 'Review', 'Question'];

/** Mock Reddit post templates. */
const MOCK_POSTS = {
  positive: [
    {
      title: 'Just came back from Goa - absolutely loved it!',
      body: 'Spent 10 days in South Goa and it was magical. Palolem beach is paradise. The locals were so welcoming and the food was incredible. Already planning my next trip!',
      subreddit: 'r/travel',
    },
    {
      title: 'Goa in the monsoon is a hidden gem',
      body: 'Everyone goes in December but monsoon Goa is something else. Lush green, empty beaches, waterfalls everywhere. Dudhsagar was at full flow. 10/10 recommend.',
      subreddit: 'r/solotravel',
    },
    {
      title: 'Shoutout to Goa\'s spice plantation tours',
      body: 'Did a tour of a spice plantation near Ponda. So educational and the lunch they serve afterward with fresh spices is INSANE. Best ₹500 I\'ve spent.',
      subreddit: 'r/india',
    },
    {
      title: 'Heritage walk in Fontainhas - wow',
      body: 'The Latin Quarter of Panaji is stunning. Portuguese-era houses, tiny cafes, art galleries. Felt like walking through a European village. Goa\'s cultural side is underrated.',
      subreddit: 'r/goa',
    },
    {
      title: 'Best seafood I\'ve had in India was in Goa',
      body: 'Tried Martin\'s Corner in Betalbatim. The butter garlic prawns and recheado fish were life-changing. Goa knows how to do food right.',
      subreddit: 'r/india',
    },
  ],
  negative: [
    {
      title: 'Goa taxi scam warning - please read before visiting',
      body: 'Airport to Calangute they wanted ₹2500. The actual rate is ₹900. No meters, no apps allowed, complete mafia. This is embarrassing for a top tourist destination.',
      subreddit: 'r/india',
    },
    {
      title: 'Is Goa even worth it anymore?',
      body: 'Visited after 5 years and honestly shocked. Beaches dirty, everything overpriced, constant harassment from vendors. North Goa has lost its charm completely.',
      subreddit: 'r/travel',
    },
    {
      title: 'Got scammed in Goa - beware of "free" boat trips',
      body: 'Some guys on Baga beach offered a free dolphin sighting trip. Took us out and then demanded ₹3000 per person. When we refused they got aggressive. Police weren\'t helpful.',
      subreddit: 'r/solotravel',
    },
    {
      title: 'Goa garbage problem is getting worse',
      body: 'The amount of trash on Vagator and Anjuna beaches is depressing. Plastic bottles, food waste, construction debris. Tourism dept needs to wake up.',
      subreddit: 'r/goa',
    },
  ],
  neutral: [
    {
      title: 'First time visiting Goa - what should I know?',
      body: 'Planning a 7-day trip to Goa in January. Budget around ₹50K for two. Should we stay in North or South Goa? Any must-visit places?',
      subreddit: 'r/travel',
    },
    {
      title: 'Goa vs Kerala for honeymoon?',
      body: 'Wife and I are torn between Goa and Kerala for our honeymoon. We like beaches, good food, and some nightlife but also want peaceful moments. Budget isn\'t a constraint.',
      subreddit: 'r/india',
    },
    {
      title: 'Best time to visit Goa? October vs December',
      body: 'Read that October is off-season with better prices but December has better weather and events. What\'s the sweet spot for first timers?',
      subreddit: 'r/solotravel',
    },
  ],
};

const MOCK_AUTHORS = [
  'TravelWithPriya',
  'BackpackerRaj',
  'SoloTraveler_UK',
  'NomadNeil',
  'BeachLover2024',
  'IndianExplorer',
  'GoaLocal99',
  'DigitalNomadAsia',
  'WanderlustKate',
  'BudgetTravelIndia',
  'FoodieOnTheRoad',
  'SurfGoa',
];

export class RedditAgent extends BaseAgent {
  readonly name = 'Reddit Agent';
  readonly source: DataSource = 'reddit';

  // TODO: Store real Reddit API client reference
  // private client: Snoowrap | null = null;

  constructor(isPrototype = true) {
    // Reddit API: 100 requests per minute
    super(100, 60 * 1000, isPrototype);
  }

  // ============================================================
  // Collection
  // ============================================================

  async collect(query: string): Promise<SentimentDataPoint[]> {
    if (this.isPrototype) {
      return this.collectMock(query);
    }

    // TODO: Phase 2 — Real Reddit API integration
    // return this.collectReal(query);
    return this.collectMock(query);
  }

  // ============================================================
  // Mock collection (prototype mode)
  // ============================================================

  private async collectMock(_query: string): Promise<SentimentDataPoint[]> {
    // Simulate network delay (80-250ms)
    await new Promise((r) => setTimeout(r, this.randInt(80, 250)));

    const count = this.randInt(1, 3); // 1-3 posts per cycle
    const posts: SentimentDataPoint[] = [];

    for (let i = 0; i < count; i++) {
      posts.push(this.generateMockPost());
    }

    return posts;
  }

  private generateMockPost(): SentimentDataPoint {
    // Weighted sentiment distribution: 45% positive, 25% negative, 30% neutral
    const roll = Math.random();
    let sentimentBucket: 'positive' | 'negative' | 'neutral';
    if (roll < 0.45) sentimentBucket = 'positive';
    else if (roll < 0.70) sentimentBucket = 'negative';
    else sentimentBucket = 'neutral';

    const mockPost = this.pick(MOCK_POSTS[sentimentBucket]);
    const author = this.pick(MOCK_AUTHORS);
    const flair = this.pick(FLAIRS);

    const sentimentScore =
      sentimentBucket === 'positive'
        ? this.rand(0.15, 0.90)
        : sentimentBucket === 'negative'
          ? this.rand(-0.90, -0.15)
          : this.rand(-0.14, 0.14);

    const upvotes = this.randInt(5, 3000);
    const comments = Math.floor(upvotes * this.rand(0.1, 0.5));
    const isViral = upvotes > 500;

    return this.normalize({
      id: this.generateId(),
      source: this.source,
      timestamp: new Date(Date.now() - this.randInt(0, 600) * 1000), // up to 10 min ago
      sentiment: Math.round(sentimentScore * 100) / 100,
      magnitude: Math.round(Math.abs(sentimentScore) * 100) / 100,
      language: 'en',
      originalText: `[${mockPost.subreddit}] ${mockPost.title}\n\n${mockPost.body}`,
      author: `u/${author}`,
      authorFollowers: this.randInt(50, 15000),
      platformMetrics: {
        views: upvotes * this.randInt(5, 20),
        likes: upvotes,
        shares: Math.floor(upvotes * this.rand(0.01, 0.05)),
        comments,
      },
      topics: this.extractTopics(mockPost.title + ' ' + mockPost.body, flair),
      isViral,
      authenticityScore: this.rand(0.70, 1.0), // Reddit tends to be more authentic
      location: this.pick(['Goa', 'North Goa', 'South Goa', 'Panaji', undefined]),
      url: `https://reddit.com/${mockPost.subreddit}/comments/${this.randInt(100000, 999999)}`,
    });
  }

  private extractTopics(text: string, flair: string): string[] {
    const topics = new Set<string>();
    const lower = text.toLowerCase();

    const topicMap: Record<string, string[]> = {
      taxi: ['transport', 'taxi', 'scam'],
      scam: ['safety', 'scam'],
      beach: ['beaches', 'coastal'],
      food: ['food', 'cuisine'],
      hotel: ['accommodation'],
      monsoon: ['weather', 'seasonal'],
      heritage: ['heritage', 'culture'],
      nightlife: ['nightlife'],
      trash: ['cleanliness', 'environment'],
      garbage: ['cleanliness', 'environment'],
      dirty: ['cleanliness', 'environment'],
      price: ['pricing', 'economy'],
      overpriced: ['pricing', 'economy'],
    };

    for (const [keyword, tags] of Object.entries(topicMap)) {
      if (lower.includes(keyword)) {
        tags.forEach((t) => topics.add(t));
      }
    }

    // Add flair-based topic
    topics.add(flair.toLowerCase());
    if (topics.size === 1) topics.add('general');
    return Array.from(topics);
  }

  protected getRateLimitWindowMs(): number {
    return 60 * 1000; // 1 minute
  }

  // ============================================================
  // Real collection (Phase 2 placeholder)
  // ============================================================

  // TODO: Phase 2 — Uncomment and implement when Reddit API keys are available
  //
  // private async collectReal(query: string): Promise<SentimentDataPoint[]> {
  //   if (!this.client) {
  //     this.client = new Snoowrap({
  //       userAgent: 'goa-sentinel:v1.0.0',
  //       clientId: process.env.REDDIT_CLIENT_ID!,
  //       clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  //       refreshToken: process.env.REDDIT_REFRESH_TOKEN!,
  //     });
  //   }
  //
  //   const posts: SentimentDataPoint[] = [];
  //
  //   for (const subreddit of SUBREDDITS) {
  //     const subName = subreddit.replace('r/', '');
  //     const newPosts = await this.client.getSubreddit(subName).getNew({ limit: 25 });
  //
  //     for (const post of newPosts) {
  //       posts.push(
  //         this.normalize({
  //           id: `reddit_${post.id}`,
  //           timestamp: new Date(post.created_utc * 1000),
  //           originalText: `${post.title}\n\n${post.selftext}`,
  //           author: `u/${post.author.name}`,
  //           platformMetrics: {
  //             views: 0, // Reddit doesn't expose views for all posts
  //             likes: post.ups,
  //             shares: 0,
  //             comments: post.num_comments,
  //           },
  //           url: `https://reddit.com${post.permalink}`,
  //           // ... map remaining fields
  //         }),
  //       );
  //     }
  //   }
  //
  //   return posts;
  // }
}
