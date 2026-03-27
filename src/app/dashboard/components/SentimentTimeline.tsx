"use client";

import { useEffect, useRef } from "react";

interface TimelineProps {
  hourlyTrend: Array<{ hour: string; sentiment: number; volume: number }>;
}

export function SentimentTimeline({ hourlyTrend }: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || hourlyTrend.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 30, right: 20, bottom: 40, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = "#64748b";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "right";
    const yLabels = ["1.0", "0.5", "0.0", "-0.5", "-1.0"];
    for (let i = 0; i < yLabels.length; i++) {
      const y = padding.top + (chartH / 4) * i + 4;
      ctx.fillText(yLabels[i], padding.left - 8, y);
    }

    // X-axis labels
    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(hourlyTrend.length / 12));
    for (let i = 0; i < hourlyTrend.length; i += step) {
      const x = padding.left + (chartW / (hourlyTrend.length - 1)) * i;
      ctx.fillText(hourlyTrend[i].hour, x, h - padding.bottom + 20);
    }

    // Sentiment line
    const points = hourlyTrend.map((d, i) => ({
      x: padding.left + (chartW / (hourlyTrend.length - 1)) * i,
      y: padding.top + chartH / 2 - (d.sentiment * chartH) / 2,
    }));

    // Gradient fill under line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
    gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.05)");
    gradient.addColorStop(1, "rgba(239, 68, 68, 0.1)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      ctx.bezierCurveTo(cx, points[i - 1].y, cx, points[i].y, points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.lineTo(points[0].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line itself
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      ctx.bezierCurveTo(cx, points[i - 1].y, cx, points[i].y, points[i].x, points[i].y);
    }
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Volume bars (subtle, at bottom)
    const maxVol = Math.max(...hourlyTrend.map((d) => d.volume), 1);
    ctx.fillStyle = "rgba(139, 92, 246, 0.2)";
    for (let i = 0; i < hourlyTrend.length; i++) {
      const barH = (hourlyTrend[i].volume / maxVol) * 30;
      const x = padding.left + (chartW / (hourlyTrend.length - 1)) * i - 3;
      ctx.fillRect(x, padding.top + chartH - barH, 6, barH);
    }

    // Zero line
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const zeroY = padding.top + chartH / 2;
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(w - padding.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Data points
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = p.y < zeroY ? "#3b82f6" : "#ef4444";
      ctx.fill();
    }
  }, [hourlyTrend]);

  return (
    <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Sentiment Timeline</h2>
          <p className="text-xs text-slate-500">Hourly sentiment score across all platforms</p>
        </div>
        <div className="flex gap-2">
          {["24h", "7d", "30d", "90d"].map((period) => (
            <button
              key={period}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === "24h"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 280 }}
      />
    </div>
  );
}
