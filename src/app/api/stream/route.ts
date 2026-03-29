import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import type { SentimentDataPoint, Alert, DataSource, DashboardSnapshot } from "@/types";

function toSentimentDataPoint(row: Record<string, unknown>): SentimentDataPoint {
  return {
    id: row.id as string,
    source: row.source as DataSource,
    timestamp: new Date(row.timestamp as string),
    sentiment: row.sentiment as number,
    magnitude: row.magnitude as number,
    sentimentLabel: row.sentiment_label as "positive" | "negative" | "neutral",
    language: row.language as string,
    originalText: row.original_text as string,
    translatedText: row.translated_text as string | undefined,
    author: row.author as string,
    authorFollowers: row.author_followers as number | undefined,
    platformMetrics: {
      views: row.views as number,
      likes: row.likes as number,
      shares: row.shares as number,
      comments: row.comments as number,
    },
    topics: row.topics as string[],
    isViral: row.is_viral as boolean,
    authenticityScore: row.authenticity_score as number,
    location: row.location as string | undefined,
    url: (row.url as string) || "",
  };
}

async function fetchSnapshot(): Promise<DashboardSnapshot | null> {
  try {
    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    const { data: alerts } = await supabaseAdmin
      .from("alerts")
      .select("*, posts!trigger_post_id(*), counter_narratives(*)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10);

    const mappedPosts = (posts || []).map(toSentimentDataPoint);
    const totalMentions = mappedPosts.length;
    const avgSentiment =
      totalMentions > 0
        ? mappedPosts.reduce((sum, p) => sum + p.sentiment, 0) / totalMentions
        : 0;

    const activeAlertsList: Alert[] = (alerts || []).map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      status: a.status,
      triggerPost: a.posts ? toSentimentDataPoint(a.posts) : mappedPosts[0],
      generatedResponses: (a.counter_narratives || []).map((cn: Record<string, unknown>) => ({
        id: cn.id as string,
        type: cn.type as string,
        text: cn.text as string,
        platform: cn.platform as DataSource,
        approved: cn.approved as boolean,
        generatedAt: new Date(cn.generated_at as string),
      })),
      createdAt: new Date(a.created_at),
      acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
    }));

    const sentimentBySource: Record<string, number> = {};
    const sourceCounts: Record<string, number> = {};
    for (const p of mappedPosts) {
      sentimentBySource[p.source] = (sentimentBySource[p.source] || 0) + p.sentiment;
      sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
    }
    for (const src of Object.keys(sentimentBySource)) {
      sentimentBySource[src] /= sourceCounts[src] || 1;
    }

    const langMap: Record<string, { total: number; count: number }> = {};
    for (const p of mappedPosts) {
      if (!langMap[p.language]) langMap[p.language] = { total: 0, count: 0 };
      langMap[p.language].total += p.sentiment;
      langMap[p.language].count++;
    }
    const sentimentByLanguage: Record<string, { score: number; percentage: number }> = {};
    for (const [lang, data] of Object.entries(langMap)) {
      sentimentByLanguage[lang] = {
        score: data.total / data.count,
        percentage: (data.count / totalMentions) * 100,
      };
    }

    const topicCounts: Record<string, number> = {};
    for (const p of mappedPosts) {
      for (const t of p.topics) topicCounts[t] = (topicCounts[t] || 0) + 1;
    }
    const topTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "tourism";

    return {
      overallSentiment: avgSentiment,
      totalMentionsToday: totalMentions,
      mentionsTrend: 0,
      activeAlerts: activeAlertsList.filter((a) => a.status === "active").length,
      criticalAlerts: activeAlertsList.filter((a) => a.severity === "critical").length,
      topTrendingTopic: topTopic,
      sentimentBySource: sentimentBySource as Record<DataSource, number>,
      sentimentByLanguage,
      hourlyTrend: [],
      recentPosts: mappedPosts.slice(0, 20),
      activeAlertsList,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let lastPostId: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial snapshot
      const snapshot = await fetchSnapshot();
      if (snapshot) {
        controller.enqueue(
          encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`)
        );
        if (snapshot.recentPosts.length > 0) {
          lastPostId = snapshot.recentPosts[0].id;
        }
      }

      // Poll DB every 5 seconds for new posts
      const interval = setInterval(async () => {
        try {
          let query = supabaseAdmin
            .from("posts")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

          if (lastPostId) {
            // Fetch posts created after the last one we sent
            const { data: lastPost } = await supabaseAdmin
              .from("posts")
              .select("created_at")
              .eq("id", lastPostId)
              .single();

            if (lastPost) {
              query = query.gt("created_at", lastPost.created_at);
            }
          }

          const { data: newPosts } = await query;

          if (newPosts && newPosts.length > 0) {
            for (const post of newPosts.reverse()) {
              const mapped = toSentimentDataPoint(post);
              controller.enqueue(
                encoder.encode(`event: new_post\ndata: ${JSON.stringify(mapped)}\n\n`)
              );
              lastPostId = post.id;
            }

            // Check for new alerts
            const { data: newAlerts } = await supabaseAdmin
              .from("alerts")
              .select("*, posts!trigger_post_id(*), counter_narratives(*)")
              .eq("status", "active")
              .order("created_at", { ascending: false })
              .limit(3);

            if (newAlerts && newAlerts.length > 0) {
              for (const a of newAlerts) {
                const alert: Alert = {
                  id: a.id,
                  type: a.type,
                  severity: a.severity,
                  status: a.status,
                  triggerPost: a.posts
                    ? toSentimentDataPoint(a.posts)
                    : toSentimentDataPoint(newPosts[0]),
                  generatedResponses: (a.counter_narratives || []).map(
                    (cn: Record<string, unknown>) => ({
                      id: cn.id as string,
                      type: cn.type as string,
                      text: cn.text as string,
                      platform: cn.platform as DataSource,
                      approved: cn.approved as boolean,
                      generatedAt: new Date(cn.generated_at as string),
                    })
                  ),
                  createdAt: new Date(a.created_at),
                };
                controller.enqueue(
                  encoder.encode(`event: alert\ndata: ${JSON.stringify(alert)}\n\n`)
                );
              }
            }
          }

          // Periodic snapshot refresh (every ~30 seconds = every 6th poll)
          if (Math.random() < 0.17) {
            const updatedSnapshot = await fetchSnapshot();
            if (updatedSnapshot) {
              controller.enqueue(
                encoder.encode(
                  `event: snapshot\ndata: ${JSON.stringify(updatedSnapshot)}\n\n`
                )
              );
            }
          }
        } catch {
          // Silently handle if controller is closed
        }
      }, 5000);

      // Heartbeat every 30s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));
        } catch {
          // Ignore
        }
      }, 30000);

      // Cleanup on abort
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
