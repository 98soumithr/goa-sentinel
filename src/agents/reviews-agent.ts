// ============================================================
// Goa Sentinel — Reviews Agent
// Monitors Google Reviews and TripAdvisor for Goa tourism locations.
// ============================================================

import { DataSource, SentimentDataPoint } from '@/types';
import { BaseAgent } from './base-agent';

// TODO: Import Google Places API client when moving to Phase 2
// import { Client as GoogleMapsClient } from '@googlemaps/google-maps-services-js';

/** Top Goa tourism locations to monitor. */
const GOA_LOCATIONS = [
  { name: 'Baga Beach', placeId: 'ChIJ_PLACEHOLDER_BAGA', type: 'beach' },
  { name: 'Calangute Beach', placeId: 'ChIJ_PLACEHOLDER_CALANGUTE', type: 'beach' },
  { name: 'Palolem Beach', placeId: 'ChIJ_PLACEHOLDER_PALOLEM', type: 'beach' },
  { name: 'Anjuna Beach', placeId: 'ChIJ_PLACEHOLDER_ANJUNA', type: 'beach' },
  { name: 'Dudhsagar Falls', placeId: 'ChIJ_PLACEHOLDER_DUDHSAGAR', type: 'attraction' },
  { name: 'Basilica of Bom Jesus', placeId: 'ChIJ_PLACEHOLDER_BOMJESUS', type: 'heritage' },
  { name: 'Fort Aguada', placeId: 'ChIJ_PLACEHOLDER_AGUADA', type: 'heritage' },
  { name: 'Chapora Fort', placeId: 'ChIJ_PLACEHOLDER_CHAPORA', type: 'heritage' },
  { name: 'Manohar International Airport (Mopa)', placeId: 'ChIJ_PLACEHOLDER_MOPA', type: 'infrastructure' },
  { name: 'Goa International Airport (Dabolim)', placeId: 'ChIJ_PLACEHOLDER_DABOLIM', type: 'infrastructure' },
  { name: 'Casino Pride', placeId: 'ChIJ_PLACEHOLDER_CASINO', type: 'entertainment' },
  { name: 'Sahakari Spice Farm', placeId: 'ChIJ_PLACEHOLDER_SPICEFARM', type: 'attraction' },
  { name: 'Fontainhas Latin Quarter', placeId: 'ChIJ_PLACEHOLDER_FONTAINHAS', type: 'heritage' },
  { name: 'Arpora Saturday Night Market', placeId: 'ChIJ_PLACEHOLDER_ARPORA', type: 'market' },
];

/** Mock review templates. */
const MOCK_REVIEWS = {
  positive: [
    {
      text: 'Absolutely stunning beach! Crystal clear water and the sunset was breathtaking. Beach shacks serve amazing food too. Will definitely come back.',
      rating: 5,
      platform: 'google_reviews' as DataSource,
    },
    {
      text: 'One of the best heritage sites I\'ve visited in India. Well maintained, informative guides, and the architecture is magnificent. Entry fee is very reasonable.',
      rating: 5,
      platform: 'google_reviews' as DataSource,
    },
    {
      text: 'Great experience! The staff was friendly, the facilities were clean, and the overall atmosphere was wonderful. Highly recommend for families.',
      rating: 4,
      platform: 'tripadvisor' as DataSource,
    },
    {
      text: 'Visited during the monsoon and it was magical. Less crowded, lush greenery everywhere, and the waterfalls were in full flow. A different side of Goa.',
      rating: 5,
      platform: 'tripadvisor' as DataSource,
    },
    {
      text: 'The spice plantation tour was educational and fun. Our guide explained everything about each spice. The traditional Goan lunch afterward was delicious.',
      rating: 4,
      platform: 'google_reviews' as DataSource,
    },
    {
      text: 'Best night market in India! So many unique vendors, live music, great food stalls. Spent 3 hours and bought so many souvenirs.',
      rating: 5,
      platform: 'tripadvisor' as DataSource,
    },
  ],
  negative: [
    {
      text: 'Very disappointed. The beach was dirty with plastic waste everywhere. No lifeguards on duty. Parking was chaotic and overpriced. Not worth the hype.',
      rating: 1,
      platform: 'google_reviews' as DataSource,
    },
    {
      text: 'Terrible experience at the airport. Long queues, no air conditioning in parts, and the taxi counter quoted outrageous prices. First impression of Goa was very bad.',
      rating: 1,
      platform: 'google_reviews' as DataSource,
    },
    {
      text: 'Overcrowded and overrated. Vendors are extremely pushy and won\'t leave you alone. The beach itself is mediocre. There are much better beaches in South Goa.',
      rating: 2,
      platform: 'tripadvisor' as DataSource,
    },
    {
      text: 'Heritage site is poorly maintained. Graffiti on walls, litter in the compound, and the "guide" seemed to make up half the history. Needs better management.',
      rating: 2,
      platform: 'tripadvisor' as DataSource,
    },
    {
      text: 'Got food poisoning from a beach shack here. Zero hygiene standards. Saw the kitchen area and it was shocking. Health department needs to inspect these places.',
      rating: 1,
      platform: 'google_reviews' as DataSource,
    },
  ],
  neutral: [
    {
      text: 'It\'s okay for a quick visit. Nothing spectacular but a decent beach. Gets very crowded on weekends. Better to visit on weekdays.',
      rating: 3,
      platform: 'google_reviews' as DataSource,
    },
    {
      text: 'Standard airport experience. New terminal is better than the old one. Food court is limited but serviceable. WiFi works okay.',
      rating: 3,
      platform: 'tripadvisor' as DataSource,
    },
    {
      text: 'The fort itself is interesting historically but there\'s not much to see anymore. Good views from the top though. Worth 30 minutes of your time.',
      rating: 3,
      platform: 'google_reviews' as DataSource,
    },
  ],
};

const MOCK_REVIEWER_NAMES = [
  'Priya Sharma', 'James Wilson', 'Arjun Nair', 'Maria Santos',
  'Dmitri Volkov', 'Sarah Chen', 'Vikram Patel', 'Elena Schmidt',
  'Raj Kapoor', 'Anna Müller', 'Kenji Tanaka', 'Fatima Khan',
  'Thomas Brown', 'Sneha Reddy', 'Marco Rossi', 'Yuki Sato',
];

export class ReviewsAgent extends BaseAgent {
  readonly name = 'Reviews Agent';
  readonly source: DataSource = 'google_reviews';

  // TODO: Store real Google Maps API client reference
  // private googleClient: GoogleMapsClient | null = null;

  constructor(isPrototype = true) {
    // Google Places API: ~1000 requests per day (depends on billing)
    // TripAdvisor API: 5000 requests per day
    super(1000, 24 * 60 * 60 * 1000, isPrototype);
  }

  // ============================================================
  // Collection
  // ============================================================

  async collect(query: string): Promise<SentimentDataPoint[]> {
    if (this.isPrototype) {
      return this.collectMock(query);
    }

    // TODO: Phase 2 — Real Google Places + TripAdvisor API integration
    // return this.collectReal(query);
    return this.collectMock(query);
  }

  // ============================================================
  // Mock collection (prototype mode)
  // ============================================================

  private async collectMock(_query: string): Promise<SentimentDataPoint[]> {
    // Simulate network delay (150-500ms — review APIs can be slow)
    await new Promise((r) => setTimeout(r, this.randInt(150, 500)));

    // Reviews are less frequent: 0-2 per cycle
    const count = this.randInt(0, 2);
    const posts: SentimentDataPoint[] = [];

    for (let i = 0; i < count; i++) {
      posts.push(this.generateMockReview());
    }

    return posts;
  }

  private generateMockReview(): SentimentDataPoint {
    // Review distribution: 50% positive, 20% negative, 30% neutral
    const roll = Math.random();
    let sentimentBucket: 'positive' | 'negative' | 'neutral';
    if (roll < 0.50) sentimentBucket = 'positive';
    else if (roll < 0.70) sentimentBucket = 'negative';
    else sentimentBucket = 'neutral';

    const review = this.pick(MOCK_REVIEWS[sentimentBucket]);
    const location = this.pick(GOA_LOCATIONS);
    const reviewer = this.pick(MOCK_REVIEWER_NAMES);

    // Map star rating to sentiment score
    const sentimentScore =
      sentimentBucket === 'positive'
        ? this.rand(0.30, 0.95)
        : sentimentBucket === 'negative'
          ? this.rand(-0.95, -0.30)
          : this.rand(-0.14, 0.14);

    // Reviews have different engagement: helpful votes, photos
    const helpfulVotes = this.randInt(0, 50);

    // Determine the actual source (Google or TripAdvisor)
    const actualSource = review.platform;

    return this.normalize({
      id: this.generateId(),
      source: actualSource,
      timestamp: new Date(Date.now() - this.randInt(0, 7200) * 1000), // up to 2 hours ago
      sentiment: Math.round(sentimentScore * 100) / 100,
      magnitude: Math.round(Math.abs(sentimentScore) * 100) / 100,
      language: this.pickLanguage(),
      originalText: `[${review.rating}/5 stars] ${location.name}\n\n${review.text}`,
      author: reviewer,
      authorFollowers: undefined, // Reviews don't have followers
      platformMetrics: {
        views: this.randInt(10, 5000),
        likes: helpfulVotes,
        shares: 0,
        comments: this.randInt(0, 5), // Review reply count
      },
      topics: this.extractTopics(review.text, location),
      isViral: false, // Reviews rarely go viral on their own
      authenticityScore: this.rand(0.60, 1.0),
      location: location.name,
      url: actualSource === 'google_reviews'
        ? `https://maps.google.com/place/${encodeURIComponent(location.name)}?q=${location.placeId}`
        : `https://tripadvisor.com/attraction-${location.name.replace(/\s+/g, '_')}-Goa`,
    });
  }

  private extractTopics(
    text: string,
    location: { name: string; type: string },
  ): string[] {
    const topics = new Set<string>();
    const lower = text.toLowerCase();

    // Add location type as a topic
    topics.add(location.type);

    const topicMap: Record<string, string[]> = {
      beach: ['beaches', 'coastal'],
      food: ['food', 'cuisine'],
      clean: ['cleanliness'],
      dirty: ['cleanliness', 'environment'],
      litter: ['cleanliness', 'environment'],
      plastic: ['cleanliness', 'environment'],
      staff: ['hospitality', 'service'],
      guide: ['hospitality', 'service'],
      price: ['pricing', 'value'],
      overpriced: ['pricing', 'value'],
      safety: ['safety'],
      lifeguard: ['safety', 'beach safety'],
      crowd: ['crowding', 'management'],
      parking: ['infrastructure'],
      taxi: ['transport'],
      airport: ['infrastructure', 'transport'],
      heritage: ['heritage', 'culture'],
      architecture: ['heritage', 'culture'],
      hygiene: ['health', 'food safety'],
      'food poisoning': ['health', 'food safety'],
    };

    for (const [keyword, tags] of Object.entries(topicMap)) {
      if (lower.includes(keyword)) {
        tags.forEach((t) => topics.add(t));
      }
    }

    topics.add('reviews');
    return Array.from(topics);
  }

  private pickLanguage(): string {
    // Reviews have a more international mix
    const roll = Math.random();
    if (roll < 0.45) return 'en';
    if (roll < 0.60) return 'hi';
    if (roll < 0.70) return 'ru';
    if (roll < 0.78) return 'de';
    if (roll < 0.84) return 'fr';
    if (roll < 0.89) return 'ko';
    if (roll < 0.93) return 'pt';
    if (roll < 0.97) return 'ja';
    return 'zh';
  }

  protected getRateLimitWindowMs(): number {
    return 24 * 60 * 60 * 1000; // 24 hours
  }

  // ============================================================
  // Real collection (Phase 2 placeholder)
  // ============================================================

  // TODO: Phase 2 — Uncomment and implement when API keys are available
  //
  // private async collectReal(query: string): Promise<SentimentDataPoint[]> {
  //   const posts: SentimentDataPoint[] = [];
  //
  //   // --- Google Places API ---
  //   if (!this.googleClient) {
  //     this.googleClient = new GoogleMapsClient({});
  //   }
  //
  //   for (const location of GOA_LOCATIONS) {
  //     const response = await this.googleClient.placeDetails({
  //       params: {
  //         place_id: location.placeId,
  //         fields: ['reviews'],
  //         key: process.env.GOOGLE_PLACES_API_KEY!,
  //       },
  //     });
  //
  //     for (const review of response.data.result.reviews ?? []) {
  //       posts.push(
  //         this.normalize({
  //           id: `google_${location.placeId}_${review.time}`,
  //           source: 'google_reviews',
  //           timestamp: new Date(review.time * 1000),
  //           originalText: `[${review.rating}/5 stars] ${location.name}\n\n${review.text}`,
  //           author: review.author_name,
  //           language: review.language,
  //           // ... map remaining fields
  //         }),
  //       );
  //     }
  //   }
  //
  //   // --- TripAdvisor API ---
  //   // TODO: TripAdvisor Content API integration
  //   // Note: TripAdvisor API access requires partnership application
  //   // https://developer-tripadvisor.com/content-api/
  //   //
  //   // for (const location of GOA_LOCATIONS) {
  //   //   const response = await fetch(
  //   //     `https://api.content.tripadvisor.com/api/v1/location/${location.tripAdvisorId}/reviews?key=${key}`
  //   //   );
  //   //   // ... process TripAdvisor reviews
  //   // }
  //
  //   return posts;
  // }
}
