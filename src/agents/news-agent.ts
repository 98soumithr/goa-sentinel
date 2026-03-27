// ============================================================
// Goa Sentinel — News Agent
// Aggregates news from GDELT, NewsAPI, and other sources.
// Filters for Goa tourism keywords.
// ============================================================

import { DataSource, SentimentDataPoint } from '@/types';
import { BaseAgent } from './base-agent';

// TODO: Import real news API clients when moving to Phase 2
// import NewsAPI from 'newsapi';

/** Keywords used for news search queries. */
const NEWS_KEYWORDS = [
  'Goa tourism',
  'Goa tourist',
  'Goa travel',
  'Goa beach',
  'Goa infrastructure',
  'Goa airport',
  'Goa hotel',
  'Goa safety',
  'Goa minister',
  'Rohan Khaunte',
  'Goa government tourism',
];

/** News outlet names for mock data. */
const NEWS_OUTLETS = [
  { name: 'Times of India', domain: 'timesofindia.indiatimes.com' },
  { name: 'Hindustan Times', domain: 'hindustantimes.com' },
  { name: 'NDTV', domain: 'ndtv.com' },
  { name: 'The Hindu', domain: 'thehindu.com' },
  { name: 'Gomantak Times', domain: 'gomantaktimes.com' },
  { name: 'The Goan', domain: 'thegoan.net' },
  { name: 'Herald Goa', domain: 'heraldgoa.in' },
  { name: 'NavHind Times', domain: 'navhindtimes.in' },
  { name: 'Reuters Travel', domain: 'reuters.com' },
  { name: 'BBC Travel', domain: 'bbc.com/travel' },
  { name: 'Conde Nast Traveller India', domain: 'cntraveller.in' },
  { name: 'Lonely Planet', domain: 'lonelyplanet.com' },
];

/** Mock news article templates. */
const MOCK_ARTICLES = {
  positive: [
    {
      headline: 'Goa records 20% jump in tourist arrivals in Q1 2026',
      body: 'The Goa Tourism Department has reported a significant 20% increase in tourist arrivals during the first quarter of 2026, with both domestic and international visitors contributing to the surge. Minister Rohan Khaunte attributed the growth to improved infrastructure and new marketing campaigns targeting European and Asian markets.',
    },
    {
      headline: 'Goa ranked among top 5 beach destinations in Asia by Travel+Leisure',
      body: 'International travel magazine Travel+Leisure has ranked Goa among the top 5 beach destinations in Asia for 2026, citing its unique blend of Portuguese heritage, vibrant nightlife, pristine beaches, and world-class cuisine. The recognition comes as Goa invests heavily in sustainable tourism practices.',
    },
    {
      headline: 'New eco-resort in South Goa wins international sustainability award',
      body: 'A newly opened eco-resort in Agonda, South Goa, has won the Global Sustainable Tourism Council award for its zero-waste operations, solar power infrastructure, and community-based tourism model. The resort employs 85% local staff and sources all produce from nearby organic farms.',
    },
    {
      headline: 'Goa launches digital tourism platform with AI-powered itinerary planner',
      body: 'The Goa government has unveiled a state-of-the-art digital tourism platform featuring an AI-powered itinerary planner, real-time crowd monitoring at popular spots, and a unified booking system for heritage tours, water sports, and spice plantation visits.',
    },
    {
      headline: 'Mopa airport expansion to handle 13 million passengers, boost Goa tourism',
      body: 'The Manohar International Airport at Mopa is set for a major expansion that will increase its annual passenger capacity to 13 million. Officials say the expansion will include dedicated international terminals and improved connectivity to South Goa, making the state more accessible to global travelers.',
    },
  ],
  negative: [
    {
      headline: 'Tourist drownings raise safety concerns at Goa beaches',
      body: 'A spate of tourist drownings at Goa beaches has reignited debate about safety standards. Three incidents in the past week have prompted calls for more lifeguards, better signage, and stricter enforcement of swimming zones. Opposition parties have criticized the tourism department for inadequate safety measures.',
    },
    {
      headline: 'Goa taxi operators reject ride-hailing apps, tourists left stranded',
      body: 'Goa\'s powerful taxi lobby has once again blocked the entry of ride-hailing services like Uber and Ola, leaving tourists dependent on unmetered taxis with allegedly inflated fares. International visitors have taken to social media to express frustration, with some calling it a "taxi mafia" situation.',
    },
    {
      headline: 'Pollution levels at popular Goa beaches exceed safe limits: Report',
      body: 'A new environmental report has found that coliform bacteria levels at several popular North Goa beaches, including Calangute and Baga, exceed WHO safety limits. The contamination has been linked to untreated sewage discharge and inadequate waste management infrastructure.',
    },
    {
      headline: 'Drug-related incidents damaging Goa\'s family-friendly tourism image',
      body: 'A series of high-profile drug busts and related incidents in North Goa\'s party districts are threatening to damage the state\'s carefully cultivated family-friendly tourism image. Industry leaders have called for stricter enforcement while maintaining Goa\'s appeal to younger travelers.',
    },
  ],
  neutral: [
    {
      headline: 'Goa Tourism Minister announces new policy framework for 2026-27',
      body: 'Tourism Minister Rohan Khaunte has announced a comprehensive policy framework for the 2026-27 fiscal year, focusing on sustainable tourism, heritage conservation, and skill development for tourism workers. The policy includes provisions for regulating beach shacks and standardizing pricing.',
    },
    {
      headline: 'Goa monsoon season to begin early, Met department warns',
      body: 'The India Meteorological Department has predicted an early onset of the monsoon season in Goa this year, with pre-monsoon showers expected by late May. Tourism operators are preparing for the lean season while eco-tourism ventures see an opportunity to promote monsoon tourism packages.',
    },
    {
      headline: 'International conference on coastal tourism to be held in Goa',
      body: 'Goa will host the International Conference on Coastal Tourism and Sustainability in October 2026, bringing together experts from 30 countries to discuss best practices in beach tourism management, marine conservation, and community-based tourism models.',
    },
  ],
};

export class NewsAgent extends BaseAgent {
  readonly name = 'News Agent';
  readonly source: DataSource = 'news';

  // TODO: Store real NewsAPI client reference
  // private newsClient: NewsAPI | null = null;

  constructor(isPrototype = true) {
    // NewsAPI: 100 requests per day (free tier) / 250 per day (paid)
    // GDELT: essentially unlimited but we self-limit
    super(250, 24 * 60 * 60 * 1000, isPrototype);
  }

  // ============================================================
  // Collection
  // ============================================================

  async collect(query: string): Promise<SentimentDataPoint[]> {
    if (this.isPrototype) {
      return this.collectMock(query);
    }

    // TODO: Phase 2 — Real news API integration
    // return this.collectReal(query);
    return this.collectMock(query);
  }

  // ============================================================
  // Mock collection (prototype mode)
  // ============================================================

  private async collectMock(_query: string): Promise<SentimentDataPoint[]> {
    // Simulate network delay (100-400ms — news APIs can be slow)
    await new Promise((r) => setTimeout(r, this.randInt(100, 400)));

    // News articles are less frequent than social media: 0-2 per cycle
    const count = this.randInt(0, 2);
    const posts: SentimentDataPoint[] = [];

    for (let i = 0; i < count; i++) {
      posts.push(this.generateMockArticle());
    }

    return posts;
  }

  private generateMockArticle(): SentimentDataPoint {
    // News distribution: 40% positive, 30% negative, 30% neutral
    const roll = Math.random();
    let sentimentBucket: 'positive' | 'negative' | 'neutral';
    if (roll < 0.40) sentimentBucket = 'positive';
    else if (roll < 0.70) sentimentBucket = 'negative';
    else sentimentBucket = 'neutral';

    const article = this.pick(MOCK_ARTICLES[sentimentBucket]);
    const outlet = this.pick(NEWS_OUTLETS);

    const sentimentScore =
      sentimentBucket === 'positive'
        ? this.rand(0.15, 0.80) // News tends to be more measured
        : sentimentBucket === 'negative'
          ? this.rand(-0.80, -0.15)
          : this.rand(-0.14, 0.14);

    // News articles get different engagement metrics
    const views = this.randInt(500, 150000);
    const shares = Math.floor(views * this.rand(0.01, 0.08));
    const comments = Math.floor(views * this.rand(0.005, 0.03));
    const isViral = views > 50000;

    const language = this.pickLanguage(outlet.domain);

    return this.normalize({
      id: this.generateId(),
      source: this.source,
      timestamp: new Date(Date.now() - this.randInt(0, 3600) * 1000), // up to 1 hour ago
      sentiment: Math.round(sentimentScore * 100) / 100,
      magnitude: Math.round(Math.abs(sentimentScore) * 100) / 100,
      language,
      originalText: `${article.headline}\n\n${article.body}`,
      translatedText: language !== 'en' ? `${article.headline}\n\n${article.body}` : undefined,
      author: outlet.name,
      authorFollowers: this.randInt(50000, 5000000), // News outlets have large followings
      platformMetrics: { views, likes: 0, shares, comments },
      topics: this.extractTopics(article.headline, article.body),
      isViral,
      authenticityScore: this.rand(0.85, 1.0), // News sources are generally more trustworthy
      location: 'Goa',
      url: `https://${outlet.domain}/goa-tourism-${Date.now()}`,
    });
  }

  private extractTopics(headline: string, body: string): string[] {
    const topics = new Set<string>();
    const text = `${headline} ${body}`.toLowerCase();

    const topicMap: Record<string, string[]> = {
      airport: ['infrastructure', 'transport'],
      taxi: ['transport', 'infrastructure'],
      'ride-hailing': ['transport', 'technology'],
      safety: ['safety', 'security'],
      drowning: ['safety', 'beach safety'],
      drug: ['safety', 'law enforcement'],
      pollution: ['environment', 'health'],
      sewage: ['environment', 'infrastructure'],
      eco: ['sustainability', 'environment'],
      sustainable: ['sustainability', 'environment'],
      heritage: ['heritage', 'culture'],
      beach: ['beaches', 'tourism'],
      tourist: ['tourism', 'economy'],
      hotel: ['hospitality', 'accommodation'],
      resort: ['hospitality', 'accommodation'],
      minister: ['government', 'policy'],
      policy: ['government', 'policy'],
      monsoon: ['weather', 'seasonal'],
      award: ['recognition', 'achievement'],
      conference: ['events', 'international'],
    };

    for (const [keyword, tags] of Object.entries(topicMap)) {
      if (text.includes(keyword)) {
        tags.forEach((t) => topics.add(t));
      }
    }

    topics.add('news');
    return Array.from(topics);
  }

  private pickLanguage(domain: string): string {
    // Most Goan local news is in English, some in Hindi/Konkani
    if (domain.includes('gomantak') || domain.includes('navhind')) {
      const roll = Math.random();
      if (roll < 0.40) return 'en';
      if (roll < 0.70) return 'hi';
      return 'kok'; // Konkani
    }
    if (domain.includes('bbc') || domain.includes('reuters') || domain.includes('lonely')) {
      return 'en';
    }
    return Math.random() < 0.85 ? 'en' : 'hi';
  }

  protected getRateLimitWindowMs(): number {
    return 24 * 60 * 60 * 1000; // 24 hours
  }

  // ============================================================
  // Real collection (Phase 2 placeholder)
  // ============================================================

  // TODO: Phase 2 — Uncomment and implement when News API keys are available
  //
  // private async collectReal(query: string): Promise<SentimentDataPoint[]> {
  //   const posts: SentimentDataPoint[] = [];
  //
  //   // --- NewsAPI ---
  //   if (!this.newsClient) {
  //     this.newsClient = new NewsAPI(process.env.NEWS_API_KEY!);
  //   }
  //
  //   const newsResponse = await this.newsClient.v2.everything({
  //     q: NEWS_KEYWORDS.join(' OR '),
  //     language: 'en',
  //     sortBy: 'publishedAt',
  //     pageSize: 50,
  //   });
  //
  //   for (const article of newsResponse.articles) {
  //     posts.push(
  //       this.normalize({
  //         id: `news_${Buffer.from(article.url).toString('base64').slice(0, 12)}`,
  //         timestamp: new Date(article.publishedAt),
  //         originalText: `${article.title}\n\n${article.description ?? ''}`,
  //         author: article.source.name,
  //         url: article.url,
  //         // ... map remaining fields
  //       }),
  //     );
  //   }
  //
  //   // --- GDELT ---
  //   // TODO: Query GDELT API v2 for Goa-related news events
  //   // const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=goa+tourism&mode=artlist&format=json`;
  //   // const gdeltResponse = await fetch(gdeltUrl);
  //   // ... process GDELT results
  //
  //   return posts;
  // }
}
