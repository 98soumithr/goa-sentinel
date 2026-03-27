"use client";

import { useState, useEffect } from "react";
import type { AgentHealth, DataSource } from "@/types";

const agentDefaults: AgentHealth[] = [
  {
    name: "Twitter Agent",
    source: "twitter" as DataSource,
    status: "running",
    lastRun: new Date(),
    postsCollected: 1247,
    errorsLast24h: 2,
    avgResponseTime: 340,
    rateLimit: { remaining: 245, total: 300, resetsAt: new Date(Date.now() + 600000) },
  },
  {
    name: "Reddit Agent",
    source: "reddit" as DataSource,
    status: "running",
    lastRun: new Date(),
    postsCollected: 534,
    errorsLast24h: 0,
    avgResponseTime: 210,
    rateLimit: { remaining: 88, total: 100, resetsAt: new Date(Date.now() + 45000) },
  },
  {
    name: "Instagram Agent",
    source: "instagram" as DataSource,
    status: "running",
    lastRun: new Date(),
    postsCollected: 892,
    errorsLast24h: 1,
    avgResponseTime: 520,
    rateLimit: { remaining: 180, total: 200, resetsAt: new Date(Date.now() + 300000) },
  },
  {
    name: "News Agent",
    source: "news" as DataSource,
    status: "running",
    lastRun: new Date(),
    postsCollected: 156,
    errorsLast24h: 0,
    avgResponseTime: 780,
    rateLimit: { remaining: 450, total: 500, resetsAt: new Date(Date.now() + 3600000) },
  },
  {
    name: "Reviews Agent",
    source: "google_reviews" as DataSource,
    status: "running",
    lastRun: new Date(),
    postsCollected: 312,
    errorsLast24h: 3,
    avgResponseTime: 1200,
    rateLimit: { remaining: 95, total: 100, resetsAt: new Date(Date.now() + 1800000) },
  },
  {
    name: "TripAdvisor Agent",
    source: "tripadvisor" as DataSource,
    status: "running",
    lastRun: new Date(),
    postsCollected: 203,
    errorsLast24h: 0,
    avgResponseTime: 950,
    rateLimit: { remaining: 70, total: 100, resetsAt: new Date(Date.now() + 900000) },
  },
];

const statusColors = {
  running: "bg-green-500",
  idle: "bg-slate-500",
  error: "bg-red-500",
  rate_limited: "bg-yellow-500",
};

export function AgentStatusBar() {
  const [agents, setAgents] = useState<AgentHealth[]>(agentDefaults);
  const [expanded, setExpanded] = useState(false);

  // Simulate agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => ({
          ...agent,
          postsCollected: agent.postsCollected + Math.floor(Math.random() * 3),
          lastRun: new Date(),
          avgResponseTime: agent.avgResponseTime + Math.floor(Math.random() * 40 - 20),
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const allRunning = agents.every((a) => a.status === "running");
  const totalCollected = agents.reduce((sum, a) => sum + a.postsCollected, 0);

  return (
    <div className="bg-[#1a2235] rounded-xl border border-slate-800 overflow-hidden">
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {agents.map((agent) => (
              <span
                key={agent.name}
                className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`}
                title={`${agent.name}: ${agent.status}`}
              />
            ))}
          </div>
          <span className="text-sm text-slate-300">
            {agents.length} Agents {allRunning ? "Running" : "Active"}
          </span>
          <span className="text-xs text-slate-500">•</span>
          <span className="text-xs text-slate-500">
            {totalCollected.toLocaleString()} posts collected
          </span>
        </div>
        <span className="text-xs text-slate-500">{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-800 px-5 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                  <span className="text-xs font-medium text-slate-300">{agent.name}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Posts</span>
                    <span className="text-slate-400">{agent.postsCollected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Avg RT</span>
                    <span className="text-slate-400">{agent.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Errors/24h</span>
                    <span className={agent.errorsLast24h > 0 ? "text-red-400" : "text-green-400"}>
                      {agent.errorsLast24h}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Rate Limit</span>
                    <span className="text-slate-400">
                      {agent.rateLimit.remaining}/{agent.rateLimit.total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
