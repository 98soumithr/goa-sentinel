import { NextRequest } from "next/server";
import { realDashboardSnapshot, allRealData, realAlerts } from "@/mock-data/real-data";
import type { SentimentDataPoint, Alert } from "@/types";

// Cycle through real data points for the SSE stream
let postIndex = 0;
function getNextRealPost(): SentimentDataPoint {
  const post = allRealData[postIndex % allRealData.length];
  postIndex++;
  // Return with fresh timestamp so it appears live
  return {
    ...post,
    id: `live-${Date.now()}-${postIndex}`,
    timestamp: new Date(),
  };
}

// Check if a post should trigger an alert
function evaluateForAlert(post: SentimentDataPoint): Alert | null {
  if (post.platformMetrics.views > 10000 && post.sentiment < -0.3) {
    return {
      id: crypto.randomUUID(),
      type: "viral_negative",
      severity: post.platformMetrics.views > 50000 ? "critical" : "high",
      status: "active",
      triggerPost: post,
      generatedResponses: [
        {
          id: crypto.randomUUID(),
          type: "acknowledge_address",
          text: `We understand concerns about ${post.topics[0] || "tourism"}. The Goa Tourism Department has taken immediate steps to address this. Here are the facts...`,
          platform: post.source,
          approved: false,
          generatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          type: "provide_context",
          text: `For context: Goa welcomed 9.5M tourists in 2024 with a 94% satisfaction rate. ${post.topics[0] ? `On ${post.topics[0]}: we've invested ₹200Cr in improvements this year.` : ""}`,
          platform: post.source,
          approved: false,
          generatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
    };
  }

  if (post.authenticityScore < 0.3 && post.sentiment < -0.2) {
    return {
      id: crypto.randomUUID(),
      type: "coordinated_attack",
      severity: "medium",
      status: "active",
      triggerPost: post,
      createdAt: new Date(),
    };
  }

  return null;
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial snapshot with real data
      const snapshot = realDashboardSnapshot();
      controller.enqueue(
        encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`)
      );

      // Send real posts every 3 seconds (cycling through scraped data)
      const interval = setInterval(() => {
        try {
          const post = getNextRealPost();
          controller.enqueue(
            encoder.encode(`event: new_post\ndata: ${JSON.stringify(post)}\n\n`)
          );

          // Check for alerts on negative posts
          const alert = evaluateForAlert(post);
          if (alert) {
            controller.enqueue(
              encoder.encode(`event: alert\ndata: ${JSON.stringify(alert)}\n\n`)
            );
          }

          // Send updated snapshot periodically
          if (Math.random() < 0.15) {
            const updatedSnapshot = realDashboardSnapshot();
            controller.enqueue(
              encoder.encode(
                `event: snapshot\ndata: ${JSON.stringify(updatedSnapshot)}\n\n`
              )
            );
          }
        } catch {
          // Silently handle if controller is closed
        }
      }, 3000);

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
