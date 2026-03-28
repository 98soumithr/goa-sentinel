"use client";

import type { SentimentDataPoint } from "@/types";

interface DateTimelineProps {
  posts: SentimentDataPoint[];
  selectedDate: string | "all";
  onDateChange: (date: string | "all") => void;
}

const dateRange = [
  { key: "all", label: "All Days", sublabel: "Mar 24-28" },
  { key: "2026-03-24", label: "Mon 24", sublabel: "Mar 24" },
  { key: "2026-03-25", label: "Tue 25", sublabel: "Mar 25" },
  { key: "2026-03-26", label: "Wed 26", sublabel: "Mar 26" },
  { key: "2026-03-27", label: "Thu 27", sublabel: "Mar 27" },
  { key: "2026-03-28", label: "Fri 28", sublabel: "Mar 28" },
];

function getPostCountForDate(posts: SentimentDataPoint[], dateKey: string): number {
  if (dateKey === "all") return posts.length;
  return posts.filter((p) => {
    const d = typeof p.timestamp === "string" ? new Date(p.timestamp) : p.timestamp;
    return d.toISOString().slice(0, 10) === dateKey;
  }).length;
}

function getSentimentForDate(posts: SentimentDataPoint[], dateKey: string): number | null {
  const filtered = dateKey === "all"
    ? posts
    : posts.filter((p) => {
        const d = typeof p.timestamp === "string" ? new Date(p.timestamp) : p.timestamp;
        return d.toISOString().slice(0, 10) === dateKey;
      });
  if (filtered.length === 0) return null;
  return filtered.reduce((sum, p) => sum + p.sentiment, 0) / filtered.length;
}

function sentimentDot(score: number | null): string {
  if (score === null) return "bg-slate-600";
  if (score >= 0.2) return "bg-green-500";
  if (score >= -0.1) return "bg-yellow-500";
  return "bg-red-500";
}

export function DateTimeline({ posts, selectedDate, onDateChange }: DateTimelineProps) {
  return (
    <div className="bg-[#1a2235] rounded-xl p-4 card-glow border border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-white">Data Timeline</h3>
          <span className="text-xs text-slate-500">March 24-28, 2026</span>
        </div>
        <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-1 rounded">
          Scraped from 6 platforms
        </span>
      </div>

      <div className="flex gap-2">
        {dateRange.map(({ key, label, sublabel }) => {
          const count = getPostCountForDate(posts, key);
          const sentiment = getSentimentForDate(posts, key);
          const isSelected = selectedDate === key;

          return (
            <button
              key={key}
              onClick={() => onDateChange(key)}
              className={`flex-1 rounded-lg px-2 py-2.5 transition-all text-center border ${
                isSelected
                  ? "bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/30"
                  : "bg-slate-800/50 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800"
              }`}
            >
              <p className={`text-xs font-semibold ${isSelected ? "text-blue-400" : "text-slate-300"}`}>
                {label}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${sentimentDot(sentiment)}`} />
                <span className="text-[10px] text-slate-500">{count} posts</span>
              </div>
              {sentiment !== null && (
                <p className={`text-[10px] font-mono mt-0.5 ${
                  sentiment >= 0.15 ? "text-green-400" : sentiment <= -0.15 ? "text-red-400" : "text-yellow-400"
                }`}>
                  {sentiment > 0 ? "+" : ""}{sentiment.toFixed(2)}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
