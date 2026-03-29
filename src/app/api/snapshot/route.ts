import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import type { DashboardSnapshot, SentimentDataPoint, Alert, DataSource } from "@/types";

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

export async function GET() {
  try {
    // Fetch recent posts
    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    // Fetch active alerts with their trigger posts
    const { data: alerts } = await supabaseAdmin
      .from("alerts")
      .select("*, posts!trigger_post_id(*), counter_narratives(*)")
      .order("created_at", { ascending: false })
      .limit(20);

    const mappedPosts = (posts || []).map(toSentimentDataPoint);

    // Compute aggregations
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
      acknowledgedBy: a.acknowledged_by || undefined,
    }));

    // Sentiment by source
    const sentimentBySource: Record<string, number> = {};
    for (const p of mappedPosts) {
      if (!sentimentBySource[p.source]) {
        sentimentBySource[p.source] = 0;
      }
      sentimentBySource[p.source] += p.sentiment;
    }
    const sourceCounts: Record<string, number> = {};
    for (const p of mappedPosts) {
      sourceCounts[p.source] = (sourceCounts[p.source] || 0) + 1;
    }
    for (const src of Object.keys(sentimentBySource)) {
      sentimentBySource[src] /= sourceCounts[src] || 1;
    }

    // Sentiment by language
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

    // Hourly trend (last 24 hours)
    const hourlyTrend: Array<{ hour: string; sentiment: number; volume: number }> = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);

      const hourPosts = mappedPosts.filter(
        (p) => p.timestamp >= hourStart && p.timestamp < hourEnd
      );
      hourlyTrend.push({
        hour: hourStart.toISOString().slice(11, 16),
        sentiment:
          hourPosts.length > 0
            ? hourPosts.reduce((s, p) => s + p.sentiment, 0) / hourPosts.length
            : 0,
        volume: hourPosts.length,
      });
    }

    // Top topic
    const topicCounts: Record<string, number> = {};
    for (const p of mappedPosts) {
      for (const t of p.topics) {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      }
    }
    const topTopic =
      Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "tourism";

    const snapshot: DashboardSnapshot = {
      overallSentiment: avgSentiment,
      totalMentionsToday: totalMentions,
      mentionsTrend: 0,
      activeAlerts: activeAlertsList.filter((a) => a.status === "active").length,
      criticalAlerts: activeAlertsList.filter((a) => a.severity === "critical").length,
      topTrendingTopic: topTopic,
      sentimentBySource: sentimentBySource as Record<DataSource, number>,
      sentimentByLanguage,
      hourlyTrend,
      recentPosts: mappedPosts.slice(0, 20),
      activeAlertsList,
    };

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Snapshot error:", error);
    return NextResponse.json({ error: "Failed to fetch snapshot" }, { status: 500 });
  }
}
