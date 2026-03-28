"use client";

import { useState } from "react";
import type { Alert, DataSource } from "@/types";

interface AlertsFeedProps {
  alerts: Alert[];
}

const severityConfig = {
  critical: { bg: "bg-red-500/10", border: "border-red-500/40", dot: "bg-red-500", text: "text-red-400", badge: "bg-red-500/20 text-red-400" },
  high: { bg: "bg-orange-500/10", border: "border-orange-500/40", dot: "bg-orange-500", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-400" },
  medium: { bg: "bg-yellow-500/10", border: "border-yellow-500/40", dot: "bg-yellow-500", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-400" },
  low: { bg: "bg-blue-500/10", border: "border-blue-500/40", dot: "bg-blue-500", text: "text-blue-400", badge: "bg-blue-500/20 text-blue-400" },
};

const sourceLabels: Record<DataSource, string> = {
  twitter: "Twitter/X",
  reddit: "Reddit",
  instagram: "Instagram",
  news: "News",
  google_reviews: "Google Reviews",
  tripadvisor: "TripAdvisor",
};

const sourceIcons: Record<DataSource, string> = {
  twitter: "𝕏",
  reddit: "r/",
  instagram: "IG",
  news: "📰",
  google_reviews: "G",
  tripadvisor: "TA",
};

const typeLabels: Record<string, string> = {
  viral_negative: "Viral Negative",
  coordinated_attack: "Coordinated Attack",
  trending_topic: "Trending Topic",
  sentiment_drop: "Sentiment Drop",
};

function formatAlertDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function AlertsFeed({ alerts }: AlertsFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-2xl mb-2">&#x2705;</p>
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          sortedAlerts.slice(0, 10).map((alert) => {
            const config = severityConfig[alert.severity];
            const isExpanded = expandedId === alert.id;
            const src = alert.triggerPost.source;

            return (
              <div
                key={alert.id}
                className={`${config.bg} ${config.border} border rounded-xl p-4 transition-all hover:scale-[1.005] cursor-pointer`}
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
              >
                {/* Header row: Severity + Type + Date */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${config.dot} ${alert.severity === "critical" ? "animate-pulse" : ""}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${config.text}`}>
                      {alert.severity}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {typeLabels[alert.type] || alert.type}
                    </span>
                  </div>
                  {/* Status badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    alert.status === "active" ? "bg-red-500/15 text-red-400" :
                    alert.status === "acknowledged" ? "bg-yellow-500/15 text-yellow-400" :
                    "bg-green-500/15 text-green-400"
                  }`}>
                    {alert.status.toUpperCase()}
                  </span>
                </div>

                {/* Date + Source row — PROMINENT */}
                <div className="flex items-center gap-3 mb-2.5 bg-slate-800/30 rounded-lg px-3 py-2">
                  {/* Date with calendar icon */}
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[11px] text-slate-300 font-medium">
                      {formatAlertDate(alert.createdAt)}
                    </span>
                  </div>
                  <span className="text-slate-700">|</span>
                  {/* Source with platform icon — clickable */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500">{sourceIcons[src]}</span>
                    {alert.triggerPost.url ? (
                      <a
                        href={alert.triggerPost.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 decoration-blue-400/30 hover:decoration-blue-300/50 transition-colors"
                      >
                        View on {sourceLabels[src]}
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-300 font-medium">
                        Reported on {sourceLabels[src]}
                      </span>
                    )}
                  </div>
                  {/* Location */}
                  {alert.triggerPost.location && (
                    <>
                      <span className="text-slate-700">|</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[11px] text-slate-400">{alert.triggerPost.location}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Post content */}
                <p className={`text-sm text-slate-300 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                  {alert.triggerPost.originalText}
                </p>

                {/* Metrics row */}
                <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-slate-700/20">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {alert.triggerPost.platformMetrics.views.toLocaleString()} views
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {alert.triggerPost.platformMetrics.shares?.toLocaleString() || 0} shares
                  </span>
                  <span className="text-[10px] text-slate-500">
                    by {alert.triggerPost.author}
                  </span>
                  {alert.triggerPost.url && (
                    <a
                      href={alert.triggerPost.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Original
                    </a>
                  )}
                  {alert.generatedResponses && alert.generatedResponses.length > 0 && (
                    <span className="text-[10px] text-green-400 font-medium ml-auto flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {alert.generatedResponses.length} responses ready
                    </span>
                  )}
                </div>

                {/* Expanded: Show counter-narratives */}
                {isExpanded && alert.generatedResponses && alert.generatedResponses.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">AI Counter-Narratives</p>
                    {alert.generatedResponses.map((r, i) => (
                      <div key={i} className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-blue-400 uppercase">
                            {r.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-slate-600">for {sourceLabels[r.platform] || r.platform}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
