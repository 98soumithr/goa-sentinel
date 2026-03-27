"use client";

import { useState } from "react";
import type { SentimentDataPoint, DataSource } from "@/types";

interface LiveFeedProps {
  posts: SentimentDataPoint[];
}

const sourceIcons: Record<DataSource, string> = {
  twitter: "𝕏",
  reddit: "R",
  instagram: "IG",
  news: "📰",
  google_reviews: "G",
  tripadvisor: "TA",
};

const sourceColors: Record<DataSource, string> = {
  twitter: "bg-slate-600",
  reddit: "bg-orange-600",
  instagram: "bg-pink-600",
  news: "bg-blue-600",
  google_reviews: "bg-green-600",
  tripadvisor: "bg-emerald-600",
};

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
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

      {/* Source filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-slate-300"
          }`}
        >
          All
        </button>
        {(Object.keys(sourceIcons) as DataSource[]).map((source) => (
          <button
            key={source}
            onClick={() => setFilter(source)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filter === source
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-300"
            }`}
          >
            {sourceIcons[source]}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
        {filtered.slice(0, 20).map((post) => {
          const sentimentColor =
            post.sentiment >= 0.3
              ? "text-green-400"
              : post.sentiment >= -0.1
              ? "text-yellow-400"
              : "text-red-400";

          const sentimentBar =
            post.sentiment >= 0.3
              ? "bg-green-500"
              : post.sentiment >= -0.1
              ? "bg-yellow-500"
              : "bg-red-500";

          return (
            <div
              key={post.id}
              className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`${sourceColors[post.source]} text-white text-[10px] font-bold w-7 h-7 rounded flex items-center justify-center flex-shrink-0`}
                >
                  {sourceIcons[post.source]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-slate-400 font-medium truncate">
                      @{post.author}
                    </span>
                    <span className="text-[10px] text-slate-600">{timeAgo(post.timestamp)}</span>
                    {post.isViral && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-medium">
                        VIRAL
                      </span>
                    )}
                    {post.authenticityScore < 0.4 && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-medium">
                        SUS
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">{post.originalText}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sentimentBar}`}
                          style={{ width: `${((post.sentiment + 1) / 2) * 100}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono ${sentimentColor}`}>
                        {post.sentiment.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600">
                      {post.platformMetrics.views.toLocaleString()} views
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {post.language.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
