"use client";

import { useState } from "react";
import type { SentimentDataPoint, DataSource } from "@/types";

interface LiveFeedProps {
  posts: SentimentDataPoint[];
}

const sourceConfig: Record<DataSource, { label: string; icon: string; color: string; bg: string }> = {
  twitter: { label: "Twitter/X", icon: "𝕏", color: "text-sky-400", bg: "bg-sky-500/15 border-sky-500/30" },
  reddit: { label: "Reddit", icon: "r/", color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30" },
  instagram: { label: "Instagram", icon: "IG", color: "text-pink-400", bg: "bg-pink-500/15 border-pink-500/30" },
  news: { label: "News", icon: "📰", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
  google_reviews: { label: "Google Reviews", icon: "G", color: "text-green-400", bg: "bg-green-500/15 border-green-500/30" },
  tripadvisor: { label: "TripAdvisor", icon: "TA", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
};

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  if (diffDays === 0) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  const dateStr = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  return `${dateStr}, ${timeStr}`;
}

function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export function LiveFeed({ posts }: LiveFeedProps) {
  const [filter, setFilter] = useState<DataSource | "all">("all");

  const filtered = filter === "all" ? posts : posts.filter((p) => p.source === filter);

  return (
    <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Live Feed</h2>
          <p className="text-xs text-slate-500">Real-time mentions across platforms</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">STREAMING</span>
        </div>
      </div>

      {/* Source filter tabs with readable labels */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-slate-300"
          }`}
        >
          All Sources
        </button>
        {(Object.keys(sourceConfig) as DataSource[]).map((source) => {
          const cfg = sourceConfig[source];
          return (
            <button
              key={source}
              onClick={() => setFilter(source)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filter === source
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-300"
              }`}
            >
              <span className="text-[10px]">{cfg.icon}</span>
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Posts */}
      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        {filtered.slice(0, 20).map((post) => {
          const cfg = sourceConfig[post.source];
          const sentimentColor =
            post.sentiment >= 0.3 ? "text-green-400"
            : post.sentiment >= -0.1 ? "text-yellow-400"
            : "text-red-400";
          const sentimentBar =
            post.sentiment >= 0.3 ? "bg-green-500"
            : post.sentiment >= -0.1 ? "bg-yellow-500"
            : "bg-red-500";

          return (
            <div
              key={post.id}
              className="bg-slate-800/40 rounded-lg p-3.5 border border-slate-700/30 hover:border-slate-600/50 transition-all group"
            >
              {/* Top row: Source badge + Date + Badges */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {/* Source badge — prominent */}
                  <span className={`${cfg.bg} border ${cfg.color} text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1`}>
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </span>
                  {post.isViral && (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-md font-semibold animate-pulse">
                      VIRAL
                    </span>
                  )}
                  {post.authenticityScore < 0.4 && (
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-md font-semibold">
                      SUSPICIOUS
                    </span>
                  )}
                </div>
                {/* Date — prominent */}
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {formatDate(post.timestamp)}
                </span>
              </div>

              {/* Author + Location */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-slate-400 font-medium">
                  {post.author.startsWith("@") || post.author.startsWith("u/") ? post.author : `@${post.author}`}
                </span>
                {post.location && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {post.location}
                    </span>
                  </>
                )}
              </div>

              {/* Post text */}
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 mb-2">{post.originalText}</p>

              {/* View Source link */}
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 mb-2 transition-colors opacity-70 group-hover:opacity-100"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on {cfg.label}
                </a>
              )}

              {/* Bottom row: Sentiment + Metrics */}
              <div className="flex items-center gap-3 pt-1.5 border-t border-slate-700/20">
                <div className="flex items-center gap-1.5">
                  <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sentimentBar}`}
                      style={{ width: `${((post.sentiment + 1) / 2) * 100}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono font-semibold ${sentimentColor}`}>
                    {post.sentiment > 0 ? "+" : ""}{post.sentiment.toFixed(2)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {post.platformMetrics.views.toLocaleString()} views
                </span>
                <span className="text-[10px] text-slate-500">
                  {post.platformMetrics.likes.toLocaleString()} likes
                </span>
                {post.topics.length > 0 && (
                  <span className="text-[10px] text-purple-400/70 ml-auto">
                    #{post.topics[0]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
