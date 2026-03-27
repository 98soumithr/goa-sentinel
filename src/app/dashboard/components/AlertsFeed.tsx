"use client";

import type { Alert } from "@/types";

interface AlertsFeedProps {
  alerts: Alert[];
}

const severityConfig = {
  critical: { bg: "bg-red-500/20", border: "border-red-500/50", dot: "bg-red-500", text: "text-red-400" },
  high: { bg: "bg-orange-500/20", border: "border-orange-500/50", dot: "bg-orange-500", text: "text-orange-400" },
  medium: { bg: "bg-yellow-500/20", border: "border-yellow-500/50", dot: "bg-yellow-500", text: "text-yellow-400" },
  low: { bg: "bg-blue-500/20", border: "border-blue-500/50", dot: "bg-blue-500", text: "text-blue-400" },
};

const typeLabels: Record<string, string> = {
  viral_negative: "Viral Negative",
  coordinated_attack: "Coordinated Attack",
  trending_topic: "Trending Topic",
  sentiment_drop: "Sentiment Drop",
};

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function AlertsFeed({ alerts }: AlertsFeedProps) {
  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Active Alerts</h2>
          <p className="text-xs text-slate-500">{alerts.length} alerts requiring attention</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400 font-medium">LIVE</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          sortedAlerts.slice(0, 10).map((alert) => {
            const config = severityConfig[alert.severity];
            return (
              <div
                key={alert.id}
                className={`${config.bg} ${config.border} border rounded-lg p-3 transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.dot} ${alert.severity === "critical" ? "animate-pulse" : ""}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${config.text}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">
                      {typeLabels[alert.type] || alert.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {timeAgo(alert.createdAt)}
                  </span>
                </div>

                <p className="text-sm text-slate-300 line-clamp-2">
                  {alert.triggerPost.originalText}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                    {alert.triggerPost.source}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {alert.triggerPost.platformMetrics.views.toLocaleString()} views
                  </span>
                  {alert.generatedResponses && alert.generatedResponses.length > 0 && (
                    <span className="text-[10px] text-green-400 ml-auto">
                      {alert.generatedResponses.length} responses ready
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
