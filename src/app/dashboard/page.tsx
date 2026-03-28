"use client";

import { useState, useEffect } from "react";
import type { DashboardSnapshot, Alert, SentimentDataPoint } from "@/types";
import { KPICards } from "./components/KPICards";
import { SentimentTimeline } from "./components/SentimentTimeline";
import { SourceBreakdown } from "./components/SourceBreakdown";
import { LanguageBreakdown } from "./components/LanguageBreakdown";
import { AlertsFeed } from "./components/AlertsFeed";
import { LiveFeed } from "./components/LiveFeed";
import { AgentStatusBar } from "./components/AgentStatusBar";
import { Header } from "./components/Header";
import { DateTimeline } from "./components/DateTimeline";

function filterByDate(posts: SentimentDataPoint[], dateKey: string | "all"): SentimentDataPoint[] {
  if (dateKey === "all") return posts;
  return posts.filter((p) => {
    const d = typeof p.timestamp === "string" ? new Date(p.timestamp) : p.timestamp;
    return d.toISOString().slice(0, 10) === dateKey;
  });
}

function filterAlertsByDate(alerts: Alert[], dateKey: string | "all"): Alert[] {
  if (dateKey === "all") return alerts;
  return alerts.filter((a) => {
    const d = typeof a.createdAt === "string" ? new Date(a.createdAt) : a.createdAt;
    return d.toISOString().slice(0, 10) === dateKey;
  });
}

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [allPosts, setAllPosts] = useState<SentimentDataPoint[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | "all">("all");

  useEffect(() => {
    fetch("/api/snapshot")
      .then((res) => res.json())
      .then((data) => {
        setSnapshot(data);
        setAllPosts(data.recentPosts || []);
        setConnected(true);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/stream");

    eventSource.onopen = () => setConnected(true);

    eventSource.addEventListener("snapshot", (e) => {
      const data = JSON.parse(e.data);
      setSnapshot(data);
      setAllPosts((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const newPosts = (data.recentPosts || []).filter(
          (p: SentimentDataPoint) => !existing.has(p.id)
        );
        return [...newPosts, ...prev].slice(0, 100);
      });
      setLastUpdate(new Date());
    });

    eventSource.addEventListener("new_post", (e) => {
      const post: SentimentDataPoint = JSON.parse(e.data);
      setAllPosts((prev) => [post, ...prev].slice(0, 100));
      setSnapshot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalMentionsToday: prev.totalMentionsToday + 1,
          recentPosts: [post, ...prev.recentPosts.slice(0, 19)],
        };
      });
      setLastUpdate(new Date());
    });

    eventSource.addEventListener("alert", (e) => {
      const alert: Alert = JSON.parse(e.data);
      setSnapshot((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          activeAlerts: prev.activeAlerts + 1,
          criticalAlerts:
            alert.severity === "critical"
              ? prev.criticalAlerts + 1
              : prev.criticalAlerts,
          activeAlertsList: [alert, ...prev.activeAlertsList],
        };
      });
      setLastUpdate(new Date());
    });

    eventSource.onerror = () => setConnected(false);

    return () => eventSource.close();
  }, []);

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading Sentinel...</p>
          <p className="text-slate-600 text-sm mt-1">Connecting to real-time data stream</p>
        </div>
      </div>
    );
  }

  const feedPosts = allPosts.length > 0 ? allPosts : snapshot.recentPosts;
  const filteredPosts = filterByDate(feedPosts, selectedDate);
  const filteredAlerts = filterAlertsByDate(snapshot.activeAlertsList, selectedDate);

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Header
        connected={connected}
        lastUpdate={lastUpdate}
        alertCount={snapshot.activeAlerts}
        criticalCount={snapshot.criticalAlerts}
      />

      <main className="max-w-[1920px] mx-auto px-4 py-6 space-y-5">
        {/* Interactive Date Timeline */}
        <DateTimeline
          posts={feedPosts}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* KPI Cards */}
        <KPICards snapshot={snapshot} />

        {/* Sentiment Timeline */}
        <SentimentTimeline hourlyTrend={snapshot.hourlyTrend} />

        {/* Source + Language Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SourceBreakdown sentimentBySource={snapshot.sentimentBySource} />
          <LanguageBreakdown sentimentByLanguage={snapshot.sentimentByLanguage} />
        </div>

        {/* Alerts + Live Feed — filtered by selected date */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AlertsFeed alerts={filteredAlerts} />
          <LiveFeed posts={filteredPosts} />
        </div>

        {/* Agent Status Bar */}
        <AgentStatusBar />
      </main>
    </div>
  );
}
