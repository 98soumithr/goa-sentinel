// ============================================================
// Goa Sentinel — Pre-Built Demo Scenarios
// Each scenario produces timed SentimentDataPoint[] and Alert[]
// for realistic demo presentations.
// ============================================================

import type {
  SentimentDataPoint,
  Alert,
  DataSource,
} from '@/types';

import {
  generateDataPoint,
  generateAlert,
  dailyActivityMultiplier,
} from './generator';

import {
  viralNegativePosts,
  coordinatedAttackPosts,
  competitorDestinations,
  goaLocations,
  positiveFacts,
  englishPosts,
} from './seed-data';

function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// ─── Scenario Result Type ──────────────────────────────────

export interface ScenarioResult {
  name: string;
  description: string;
  durationMinutes: number;
  dataPoints: SentimentDataPoint[];
  alerts: Alert[];
}

// ─── Scenario: Normal Day ──────────────────────────────────

/**
 * "normal_day" — Steady, slightly positive sentiment across all platforms.
 * No major incidents. Typical activity cycle. Good for establishing baseline.
 *
 * Duration: 6 hours of simulated data
 */
export function normalDay(): ScenarioResult {
  const durationMinutes = 360; // 6 hours
  const now = Date.now();
  const startTime = now - durationMinutes * 60 * 1000;

  const dataPoints: SentimentDataPoint[] = [];
  const alerts: Alert[] = [];

  // Generate posts spread across the time window
  // ~15 posts per hour at peak, scaled by daily activity cycle
  for (let minute = 0; minute < durationMinutes; minute += 2) {
    const timestamp = new Date(startTime + minute * 60 * 1000);
    const activity = dailyActivityMultiplier(timestamp);

    // Skip low-activity periods probabilistically
    if (Math.random() > activity * 1.2) continue;

    const point = generateDataPoint({
      timestamp,
      sentimentOverride: randBetween(0.15, 0.55), // slightly positive baseline
    });

    dataPoints.push(point);
  }

  // Maybe one low-severity alert from any mildly negative post
  const mildNegative = dataPoints.find((p) => p.sentiment < -0.1 && p.sentiment > -0.4);
  if (mildNegative) {
    alerts.push(generateAlert(mildNegative, 'trending_topic', 'low'));
  }

  return {
    name: 'normal_day',
    description: 'Steady positive sentiment across platforms. No major incidents. Typical Goa tourism day.',
    durationMinutes,
    dataPoints: dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    alerts,
  };
}

// ─── Scenario: Viral Negative ──────────────────────────────

/**
 * "viral_negative" — Starts normal, then a negative post about beach pollution
 * goes viral. Alert triggers. Sentiment drops sharply. Shows the system
 * detecting and responding in real-time.
 *
 * Timeline:
 *   0-90 min:  Normal positive flow
 *   90 min:    Negative post appears (beach pollution complaint)
 *   90-120:    Post starts gaining traction, viral threshold hit
 *   120-180:   Viral explosion, related negative posts appear
 *   180-240:   Counter-narratives deployed, gradual recovery begins
 *   240-360:   Partial recovery, sentiment stabilizing
 *
 * Duration: 6 hours
 */
export function viralNegative(): ScenarioResult {
  const durationMinutes = 360;
  const now = Date.now();
  const startTime = now - durationMinutes * 60 * 1000;
  const viralTriggerMinute = 90;
  const viralPeakMinute = 150;
  const recoveryStartMinute = 240;

  const dataPoints: SentimentDataPoint[] = [];
  const alerts: Alert[] = [];

  for (let minute = 0; minute < durationMinutes; minute += 2) {
    const timestamp = new Date(startTime + minute * 60 * 1000);
    const activity = dailyActivityMultiplier(timestamp);

    if (Math.random() > activity * 1.3) continue;

    // Phase 1: Normal (0-90 min)
    if (minute < viralTriggerMinute) {
      dataPoints.push(
        generateDataPoint({
          timestamp,
          sentimentOverride: randBetween(0.2, 0.5),
        })
      );
      continue;
    }

    // Phase 2: The viral trigger post (at minute 90)
    if (minute === viralTriggerMinute) {
      const beachPollutionTemplates = viralNegativePosts.beach_pollution;
      let text = pickOne(beachPollutionTemplates);
      text = text.replace('{beach}', pickOne(goaLocations));

      const viralPost = generateDataPoint({
        timestamp,
        source: 'twitter',
        sentimentOverride: -0.85,
        topicOverride: 'beaches',
        isViral: true,
        authenticityScore: 0.88, // genuinely upset tourist
        language: 'en',
      });

      // Override the text with our scenario text
      const scenarioPost: SentimentDataPoint = {
        ...viralPost,
        originalText: text,
        platformMetrics: {
          views: randInt(50000, 200000),
          likes: randInt(5000, 20000),
          shares: randInt(2000, 10000),
          comments: randInt(1000, 5000),
        },
      };

      dataPoints.push(scenarioPost);

      // Generate alerts
      alerts.push(generateAlert(scenarioPost, 'viral_negative', 'critical'));

      continue;
    }

    // Phase 3: Viral spread (90-180 min) — increasing negative sentiment
    if (minute > viralTriggerMinute && minute < recoveryStartMinute) {
      const viralProgress = (minute - viralTriggerMinute) / (viralPeakMinute - viralTriggerMinute);
      const negativeBias = Math.min(viralProgress * 0.6, 0.5);

      // Mix of regular posts and viral-reaction posts
      if (Math.random() < 0.4 + negativeBias * 0.3) {
        // Negative reaction to the viral post
        const reactionPost = generateDataPoint({
          timestamp,
          sentimentOverride: randBetween(-0.7, -0.2),
          topicOverride: 'beaches',
        });

        const reactionTexts = [
          'This is exactly my experience too. Goa beaches need urgent cleanup.',
          'Saw the same thing at multiple beaches. Authorities need to wake up.',
          'Sharing this because it needs attention. #GoaBeachCleanup',
          'I reported similar issues last month. Nothing changed.',
          'This is why I stopped recommending Goa to friends.',
          'How is this acceptable? Tourism department needs accountability.',
        ];

        dataPoints.push({
          ...reactionPost,
          originalText: pickOne(reactionTexts),
        });
      } else {
        // Regular posts still flowing, but sentiment is pulled down
        dataPoints.push(
          generateDataPoint({
            timestamp,
            sentimentOverride: randBetween(-0.1, 0.3),
          })
        );
      }

      // Sentiment drop alert at the peak
      if (minute === viralPeakMinute) {
        const peakPost = dataPoints[dataPoints.length - 1];
        alerts.push(generateAlert(peakPost, 'sentiment_drop', 'high'));
      }

      continue;
    }

    // Phase 4: Recovery (240+ min) — counter-narratives taking effect
    if (minute >= recoveryStartMinute) {
      const recoveryProgress = (minute - recoveryStartMinute) / (durationMinutes - recoveryStartMinute);
      const sentimentMean = -0.1 + recoveryProgress * 0.35; // gradual recovery to ~0.25

      if (Math.random() < 0.2) {
        // Counter-narrative style positive posts
        const positivePost = generateDataPoint({
          timestamp,
          sentimentOverride: randBetween(0.4, 0.8),
          topicOverride: 'beaches',
          language: 'en',
        });

        const recoveryTexts = [
          `Update: Visited the beach today and cleanup crews are already at work. Good response by @GoaTourism.`,
          `Let\'s be fair — one bad spot doesn\'t define all of Goa. Just came from ${pickOne(goaLocations)}, absolutely pristine.`,
          `The viral post was about ONE beach. I\'ve been to 5 Goa beaches this week, all were clean and beautiful.`,
          `${pickOne(positiveFacts)}. Credit where it\'s due.`,
          `Beach cleanup volunteers already mobilized. That\'s Goa\'s community spirit for you.`,
        ];

        dataPoints.push({
          ...positivePost,
          originalText: pickOne(recoveryTexts),
        });
      } else {
        dataPoints.push(
          generateDataPoint({
            timestamp,
            sentimentOverride: sentimentMean,
          })
        );
      }
    }
  }

  return {
    name: 'viral_negative',
    description: 'Normal flow disrupted by a viral beach pollution complaint. Alert triggers, sentiment drops, then counter-narratives deployed.',
    durationMinutes,
    dataPoints: dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    alerts,
  };
}

// ─── Scenario: Coordinated Attack ──────────────────────────

/**
 * "coordinated_attack" — Multiple similar negative posts from new/suspicious
 * accounts posting in a short window. The system detects the pattern and
 * flags it as manufactured/coordinated.
 *
 * Timeline:
 *   0-60 min:   Normal positive flow
 *   60-90 min:  Cluster of 8-12 similar negative posts appear
 *   90-120 min: System detects coordination pattern, alert triggers
 *   120-180:    Posts flagged as manufactured, authenticity scores drop
 *   180-240:    Normal flow resumes, manufactured posts deprioritized
 *
 * Duration: 4 hours
 */
export function coordinatedAttack(): ScenarioResult {
  const durationMinutes = 240;
  const now = Date.now();
  const startTime = now - durationMinutes * 60 * 1000;
  const attackStartMinute = 60;
  const attackEndMinute = 90;
  const detectionMinute = 100;

  const dataPoints: SentimentDataPoint[] = [];
  const alerts: Alert[] = [];

  // Choose a competitor destination for this attack
  const competitor = pickOne(competitorDestinations);

  for (let minute = 0; minute < durationMinutes; minute += 2) {
    const timestamp = new Date(startTime + minute * 60 * 1000);
    const activity = dailyActivityMultiplier(timestamp);

    if (Math.random() > activity * 1.3) continue;

    // Phase 1: Normal (0-60 min)
    if (minute < attackStartMinute) {
      dataPoints.push(
        generateDataPoint({
          timestamp,
          sentimentOverride: randBetween(0.2, 0.5),
        })
      );
      continue;
    }

    // Phase 2: Coordinated attack posts (60-90 min)
    if (minute >= attackStartMinute && minute < attackEndMinute) {
      // Normal posts continue
      dataPoints.push(
        generateDataPoint({
          timestamp,
          sentimentOverride: randBetween(0.1, 0.4),
        })
      );

      // Inject coordinated negative posts at higher frequency
      if (minute % 3 === 0) {
        let attackText = pickOne(coordinatedAttackPosts);
        attackText = attackText.replace('{destination}', competitor);

        const attackPost = generateDataPoint({
          timestamp: new Date(timestamp.getTime() + randInt(0, 60000)),
          source: pickOne(['twitter', 'reddit', 'instagram'] as DataSource[]),
          sentimentOverride: randBetween(-0.85, -0.6),
          topicOverride: pickOne(['beaches', 'safety', 'prices']),
          isViral: false,
          authenticityScore: randBetween(0.05, 0.25), // low authenticity — suspicious
          language: 'en',
        });

        const fakeAuthor = `@NewUser${randInt(10000, 99999)}`;

        dataPoints.push({
          ...attackPost,
          originalText: attackText,
          author: fakeAuthor,
          authorFollowers: randInt(0, 15), // new accounts with few followers
          platformMetrics: {
            views: randInt(10, 200),
            likes: randInt(0, 5),
            shares: randInt(0, 2),
            comments: randInt(0, 3),
          },
        });
      }

      continue;
    }

    // Phase 3: Detection (90-120 min)
    if (minute >= attackEndMinute && minute < 120) {
      dataPoints.push(
        generateDataPoint({
          timestamp,
          sentimentOverride: randBetween(0.0, 0.3),
        })
      );

      // Alert at detection point
      if (minute === detectionMinute) {
        const attackPosts = dataPoints.filter((p) => p.authenticityScore < 0.3);
        if (attackPosts.length > 0) {
          const triggerPost = attackPosts[attackPosts.length - 1];
          const alert = generateAlert(triggerPost, 'coordinated_attack', 'critical');
          alerts.push(alert);
        }
      }

      continue;
    }

    // Phase 4: Normalized (120+ min) — attack posts filtered, sentiment recovers
    dataPoints.push(
      generateDataPoint({
        timestamp,
        sentimentOverride: randBetween(0.15, 0.45),
      })
    );
  }

  return {
    name: 'coordinated_attack',
    description: `Manufactured negativity detected: ${8 + randInt(0, 4)} similar negative posts from new accounts promoting ${competitor}. System flags coordination pattern.`,
    durationMinutes,
    dataPoints: dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    alerts,
  };
}

// ─── Scenario: Recovery ────────────────────────────────────

/**
 * "recovery" — A negative event (safety incident) occurs, sentiment drops,
 * then official response + positive counter-narratives bring it back.
 * Demonstrates the full lifecycle: incident -> detection -> response -> recovery.
 *
 * Timeline:
 *   0-30 min:   Normal baseline
 *   30 min:     Safety incident post appears
 *   30-90 min:  Negative momentum builds, related posts pile on
 *   90 min:     Official response posted (counter-narrative deployed)
 *   90-150 min: Mixed sentiment as counter-narrative competes with negativity
 *   150-240:    Recovery takes hold, sentiment trends positive again
 *   240-300:    Full recovery, sentiment returns to or exceeds baseline
 *
 * Duration: 5 hours
 */
export function recovery(): ScenarioResult {
  const durationMinutes = 300;
  const now = Date.now();
  const startTime = now - durationMinutes * 60 * 1000;
  const incidentMinute = 30;
  const officialResponseMinute = 90;
  const recoveryTurnMinute = 150;

  const dataPoints: SentimentDataPoint[] = [];
  const alerts: Alert[] = [];

  const incidentLocation = pickOne(goaLocations);

  for (let minute = 0; minute < durationMinutes; minute += 2) {
    const timestamp = new Date(startTime + minute * 60 * 1000);
    const activity = dailyActivityMultiplier(timestamp);

    if (Math.random() > activity * 1.3) continue;

    // Phase 1: Baseline (0-30 min)
    if (minute < incidentMinute) {
      dataPoints.push(
        generateDataPoint({
          timestamp,
          sentimentOverride: randBetween(0.2, 0.5),
        })
      );
      continue;
    }

    // Phase 2: The incident post
    if (minute === incidentMinute) {
      const safetyTemplates = viralNegativePosts.safety_incident;
      let text = pickOne(safetyTemplates);
      text = text.replace('{location}', incidentLocation);

      const incidentPost = generateDataPoint({
        timestamp,
        source: 'twitter',
        sentimentOverride: -0.9,
        topicOverride: 'safety',
        isViral: true,
        authenticityScore: 0.92,
        language: 'en',
      });

      const scenarioPost: SentimentDataPoint = {
        ...incidentPost,
        originalText: text,
        location: incidentLocation,
        platformMetrics: {
          views: randInt(30000, 100000),
          likes: randInt(3000, 12000),
          shares: randInt(1500, 6000),
          comments: randInt(800, 3000),
        },
      };

      dataPoints.push(scenarioPost);
      alerts.push(generateAlert(scenarioPost, 'viral_negative', 'critical'));
      continue;
    }

    // Phase 3: Negative momentum (30-90 min)
    if (minute > incidentMinute && minute < officialResponseMinute) {
      const negativePressure = Math.min(
        (minute - incidentMinute) / (officialResponseMinute - incidentMinute),
        0.8
      );

      if (Math.random() < 0.35 + negativePressure * 0.2) {
        const negativeTexts = [
          `Not surprised about the incident at ${incidentLocation}. Safety has been deteriorating for months.`,
          'This is exactly why tourists are choosing other destinations over Goa now.',
          `Another safety failure. How many more before the government takes action? #GoaSafety`,
          'My family was planning to visit Goa next month. Cancelling after seeing this.',
          `The tourist police are nowhere when you need them. Personal experience near ${pickOne(goaLocations)}.`,
          'Second time hearing about safety issues at Goa this month. Pattern is clear.',
        ];

        const negPost = generateDataPoint({
          timestamp,
          sentimentOverride: randBetween(-0.7, -0.2),
          topicOverride: 'safety',
        });

        dataPoints.push({
          ...negPost,
          originalText: pickOne(negativeTexts),
        });
      } else {
        dataPoints.push(
          generateDataPoint({
            timestamp,
            sentimentOverride: randBetween(-0.2, 0.2),
          })
        );
      }

      // Sentiment drop alert at midpoint
      if (minute === 60) {
        const recentNeg = dataPoints.filter((p) => p.sentiment < -0.3);
        if (recentNeg.length > 0) {
          alerts.push(generateAlert(recentNeg[recentNeg.length - 1], 'sentiment_drop', 'high'));
        }
      }

      continue;
    }

    // Phase 4: Official response (at minute 90)
    if (minute === officialResponseMinute) {
      const officialPost = generateDataPoint({
        timestamp,
        source: 'twitter',
        sentimentOverride: 0.6,
        topicOverride: 'safety',
        language: 'en',
      });

      const officialTexts = [
        `OFFICIAL: Goa Tourism Department has taken immediate cognizance of the incident at ${incidentLocation}. Tourist police reinforcement deployed. 24/7 helpline 1364 active. Investigation underway. Safety of visitors is our absolute priority. — @GoaTourism`,
        `Statement from @CMGoa: "We have directed immediate action regarding the safety concern at ${incidentLocation}. Additional police presence deployed. CCTV coverage being expanded. Zero tolerance for any threat to tourist safety."`,
      ];

      dataPoints.push({
        ...officialPost,
        originalText: pickOne(officialTexts),
        author: '@GoaTourism_Official',
        authorFollowers: 850000,
        platformMetrics: {
          views: randInt(100000, 500000),
          likes: randInt(5000, 20000),
          shares: randInt(3000, 10000),
          comments: randInt(1000, 5000),
        },
      });

      continue;
    }

    // Phase 5: Mixed sentiment with recovery building (90-150 min)
    if (minute > officialResponseMinute && minute < recoveryTurnMinute) {
      const recoveryProgress = (minute - officialResponseMinute) / (recoveryTurnMinute - officialResponseMinute);

      if (Math.random() < 0.3 + recoveryProgress * 0.3) {
        const positiveRecoveryTexts = [
          `Good to see quick response from @GoaTourism. Police visible at ${pickOne(goaLocations)} now.`,
          'Just walked past the area. Tourist police patrol is active. Feeling much safer.',
          `Appreciate the transparent communication from authorities. This is how it should be handled. #GoaTourism`,
          `Confirmed: additional lighting being installed at ${incidentLocation}. Action, not just words.`,
          `I\'ve visited Goa 12 times. One incident doesn\'t erase years of safe, wonderful experiences.`,
          `Let\'s not forget — Goa is statistically one of the safest tourist states in India.`,
        ];

        const posPost = generateDataPoint({
          timestamp,
          sentimentOverride: randBetween(0.3, 0.7),
          topicOverride: 'safety',
        });

        dataPoints.push({
          ...posPost,
          originalText: pickOne(positiveRecoveryTexts),
        });
      } else {
        // Gradual sentiment improvement
        const sentimentMean = -0.1 + recoveryProgress * 0.3;
        dataPoints.push(
          generateDataPoint({
            timestamp,
            sentimentOverride: randBetween(sentimentMean - 0.2, sentimentMean + 0.3),
          })
        );
      }

      continue;
    }

    // Phase 6: Full recovery (150+ min)
    if (minute >= recoveryTurnMinute) {
      const fullRecovery = Math.min(
        (minute - recoveryTurnMinute) / (durationMinutes - recoveryTurnMinute),
        1.0
      );
      const sentimentMean = 0.15 + fullRecovery * 0.25; // recovering towards 0.4

      if (Math.random() < 0.15) {
        // Positive experience posts (regular tourists unaware of incident)
        const beachPosts = englishPosts.beaches.filter((p) => !p.includes('isappoint') && !p.includes('dirty'));
        const foodPosts = englishPosts.food.filter((p) => !p.includes('isappoint') && !p.includes('mediocre'));
        const positivePosts = [...beachPosts, ...foodPosts];

        if (positivePosts.length > 0) {
          const posPost = generateDataPoint({
            timestamp,
            sentimentOverride: randBetween(0.4, 0.8),
          });
          dataPoints.push({
            ...posPost,
            originalText: pickOne(positivePosts),
          });
        }
      } else {
        dataPoints.push(
          generateDataPoint({
            timestamp,
            sentimentOverride: randBetween(sentimentMean - 0.15, sentimentMean + 0.2),
          })
        );
      }
    }
  }

  return {
    name: 'recovery',
    description: `Safety incident at ${incidentLocation} triggers negative spiral. Official response deployed at 90 min. Full sentiment recovery by 5 hours.`,
    durationMinutes,
    dataPoints: dataPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    alerts,
  };
}

// ─── Scenario Registry ─────────────────────────────────────

export type ScenarioName = 'normal_day' | 'viral_negative' | 'coordinated_attack' | 'recovery';

const scenarioRegistry: Record<ScenarioName, () => ScenarioResult> = {
  normal_day: normalDay,
  viral_negative: viralNegative,
  coordinated_attack: coordinatedAttack,
  recovery,
};

/**
 * Run a named scenario and return its result.
 *
 * @param name - The scenario to run.
 * @returns ScenarioResult with data points, alerts, and metadata.
 */
export function runScenario(name: ScenarioName): ScenarioResult {
  const factory = scenarioRegistry[name];
  if (!factory) {
    throw new Error(`Unknown scenario: "${name}". Available: ${Object.keys(scenarioRegistry).join(', ')}`);
  }
  return factory();
}

/**
 * List all available scenario names and descriptions.
 */
export function listScenarios(): Array<{ name: ScenarioName; description: string }> {
  return [
    {
      name: 'normal_day',
      description: 'Steady positive sentiment. No incidents. Typical baseline day.',
    },
    {
      name: 'viral_negative',
      description: 'Beach pollution complaint goes viral. Alert triggers, counter-narratives deployed.',
    },
    {
      name: 'coordinated_attack',
      description: 'Manufactured negative posts from fake accounts. System detects coordination pattern.',
    },
    {
      name: 'recovery',
      description: 'Safety incident followed by official response. Full sentiment recovery lifecycle.',
    },
  ];
}
