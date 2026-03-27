"use client";

import type { DashboardSnapshot } from "@/types";

interface KPICardsProps {
  snapshot: DashboardSnapshot;
}

function sentimentToColor(score: number): string {
  if (score >= 0.3) return "text-green-400";
  if (score >= 0) return "text-yellow-400";
  return "text-red-400";
}

function sentimentToLabel(score: number): string {
  if (score >= 0.5) return "Very Positive";
  if (score >= 0.2) return "Positive";
  if (score >= -0.2) return "Neutral";
  if (score >= -0.5) return "Negative";
  return "Very Negative";
}

function trendArrow(value: number): string {
  if (value > 0) return "▲";
  if (value < 0) return "▼";
  return "—";
}

export function KPICards({ snapshot }: KPICardsProps) {
  const sentimentScore = ((snapshot.overallSentiment + 1) / 2 * 10).toFixed(1);
  const sentimentPercent = ((snapshot.overallSentiment + 1) / 2) * 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Overall Sentiment */}
      <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Overall Sentiment
        </p>
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-bold ${sentimentToColor(snapshot.overallSentiment)}`}>
            {sentimentScore}
          </span>
          <span className="text-slate-500 text-lg mb-1">/10</span>
        </div>
        <div className="mt-3 w-full bg-slate-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              snapshot.overallSentiment >= 0.2
                ? "bg-gradient-to-r from-green-500 to-emerald-400"
                : snapshot.overallSentiment >= -0.2
                ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                : "bg-gradient-to-r from-red-500 to-rose-400"
            }`}
            style={{ width: `${sentimentPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {sentimentToLabel(snapshot.overallSentiment)}
        </p>
      </div>

      {/* Total Mentions */}
      <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Mentions Today
        </p>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold text-white">
            {snapshot.totalMentionsToday.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <span
            className={`text-sm font-medium ${
              snapshot.mentionsTrend >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {trendArrow(snapshot.mentionsTrend)}{" "}
            {Math.abs(snapshot.mentionsTrend).toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500">vs yesterday</span>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Active Alerts
        </p>
        <div className="flex items-end gap-3">
          <span
            className={`text-4xl font-bold ${
              snapshot.criticalAlerts > 0 ? "text-red-400" : "text-white"
            }`}
          >
            {snapshot.activeAlerts}
          </span>
          {snapshot.criticalAlerts > 0 && (
            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded-full mb-1">
              {snapshot.criticalAlerts} CRITICAL
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Monitoring 6 platforms
        </p>
      </div>

      {/* Top Trending */}
      <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Trending Topic
        </p>
        <p className="text-2xl font-bold text-purple-400 mt-1">
          #{snapshot.topTrendingTopic}
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Most discussed across platforms
        </p>
      </div>
    </div>
  );
}
