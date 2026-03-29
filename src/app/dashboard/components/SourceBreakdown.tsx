"use client";

import type { DataSource } from "@/types";

interface SourceBreakdownProps {
  sentimentBySource: Record<string, number>;
}

const sourceConfig: Record<DataSource, { label: string; icon: string; color: string }> = {
  reddit: { label: "Reddit", icon: "R", color: "#FF4500" },
  news: { label: "News", icon: "N", color: "#10B981" },
  google_reviews: { label: "Google Reviews", icon: "G", color: "#4285F4" },
  tripadvisor: { label: "TripAdvisor", icon: "TA", color: "#00AF87" },
};

function scoreToBar(score: number): number {
  return ((score + 1) / 2) * 100;
}

function scoreColor(score: number): string {
  if (score >= 0.3) return "bg-green-500";
  if (score >= 0) return "bg-yellow-500";
  return "bg-red-500";
}

export function SourceBreakdown({ sentimentBySource }: SourceBreakdownProps) {
  const sources = Object.entries(sentimentBySource) as [DataSource, number][];

  return (
    <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
      <h2 className="text-lg font-semibold text-white mb-1">By Platform</h2>
      <p className="text-xs text-slate-500 mb-4">Sentiment score per data source</p>

      <div className="space-y-4">
        {sources.map(([source, score]) => {
          const config = sourceConfig[source];
          if (!config) return null;
          const displayScore = ((score + 1) / 2 * 10).toFixed(1);

          return (
            <div key={source} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: config.color + "33" }}
              >
                <span style={{ color: config.color }}>{config.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{config.label}</span>
                  <span className="text-sm font-mono font-medium text-white">
                    {displayScore}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${scoreColor(score)}`}
                    style={{ width: `${scoreToBar(score)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
