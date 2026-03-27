"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardSnapshot, Alert, SentimentDataPoint } from "@/types";
import { KPICards } from "./components/KPICards";
import { SentimentTimeline } from "./components/SentimentTimeline";
import { SourceBreakdown } from "./components/SourceBreakdown";
import { LanguageBreakdown } from "./components/LanguageBreakdown";
import { AlertsFeed } from "./components/AlertsFeed";
import { LiveFeed } from "./components/LiveFeed";
import { AgentStatusBar } from "./components/AgentStatusBar";
import { Header } from "./components/Header";

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch initial snapshot
  useEffect(() => {
    fetch("/api/snapshot")
      .then((res) => res.json())
      .then((data) => {
        setSnapshot(data);
        setConnected(true);
      })
      .catch(console.error);
  }, []);

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource("/api/stream");

    eventSource.onopen = () => setConnected(true);

    eventSource.addEventListener("snapshot", (e) => {
      const data = JSON.parse(e.data);
      setSnapshot(data);
      setLastUpdate(new Date());
    });

    eventSource.addEventListener("new_post", (e) => {
      const post: SentimentDataPoint = JSON.parse(e.data);
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

    eventSource.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects
    };

    return () => eventSource.close();
  }, []);

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading Sentinel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Header
        connected={connected}
        lastUpdate={lastUpdate}
        alertCount={snapshot.activeAlerts}
        criticalCount={snapshot.criticalAlerts}
      />

      <main className="max-w-[1920px] mx-auto px-4 py-6 space-y-6">
        {/* Row 1: KPI Cards */}
        <KPICards snapshot={snapshot} />

        {/* Row 2: Sentiment Timeline */}
        <SentimentTimeline hourlyTrend={snapshot.hourlyTrend} />

        {/* Row 3: Source + Language Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SourceBreakdown sentimentBySource={snapshot.sentimentBySource} />
          <LanguageBreakdown sentimentByLanguage={snapshot.sentimentByLanguage} />
        </div>

        {/* Row 4: Alerts + Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsFeed alerts={snapshot.activeAlertsList} />
          <LiveFeed posts={snapshot.recentPosts} />
        </div>

        {/* Agent Status Bar */}
        <AgentStatusBar />
      </main>
    </div>
  );
}
