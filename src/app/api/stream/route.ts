import { NextRequest } from "next/server";
import { generateDashboardSnapshot, generateDataPoint } from "@/mock-data/generator";
import type { SentimentDataPoint, Alert } from "@/types";

// Evaluate if a new post should trigger an alert
function evaluateForAlert(post: SentimentDataPoint): Alert | null {
  // High views + negative sentiment = viral negative alert
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

  // Low authenticity = potential coordinated attack
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
      // Send initial snapshot
      const snapshot = generateDashboardSnapshot();
      controller.enqueue(
        encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`)
      );

      // Send new posts every 3 seconds
      const interval = setInterval(() => {
        try {
          const post = generateDataPoint();
          controller.enqueue(
            encoder.encode(`event: new_post\ndata: ${JSON.stringify(post)}\n\n`)
          );

          // Check for alerts (~15% chance of notable post)
          const alert = evaluateForAlert(post);
          if (alert) {
            controller.enqueue(
              encoder.encode(`event: alert\ndata: ${JSON.stringify(alert)}\n\n`)
            );
          }

          // Send updated snapshot every 15 seconds
          if (Math.random() < 0.2) {
            const updatedSnapshot = generateDashboardSnapshot();
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
