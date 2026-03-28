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
    const yLabels = ["+1.0", "+0.5", "0.0", "-0.5", "-1.0"];
    for (let i = 0; i < yLabels.length; i++) {
      const y = padding.top + (chartH / 4) * i + 4;
      ctx.fillText(yLabels[i], padding.left - 8, y);
    }

    // X-axis labels
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    const dataLen = hourlyTrend.length;
    const step = Math.max(1, Math.floor(dataLen / 12));
    for (let i = 0; i < dataLen; i += step) {
      const x = padding.left + (chartW / Math.max(dataLen - 1, 1)) * i;
      ctx.fillText(hourlyTrend[i].hour, x, h - padding.bottom + 16);
    }

    // Filter out zero-volume hours for smoother line
    const nonEmpty = hourlyTrend.filter(d => d.volume > 0);
    if (nonEmpty.length < 2) return;

    const points = nonEmpty.map((d) => {
      const origIdx = hourlyTrend.indexOf(d);
      return {
        x: padding.left + (chartW / Math.max(dataLen - 1, 1)) * origIdx,
        y: padding.top + chartH / 2 - (d.sentiment * chartH) / 2,
        sentiment: d.sentiment,
        volume: d.volume,
      };
    });

    // Gradient fill
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

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cx = (points[i - 1].x + points[i].x) / 2;
      ctx.bezierCurveTo(cx, points[i - 1].y, cx, points[i].y, points[i].x, points[i].y);
    }
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Volume bars — color-coded
    const maxVol = Math.max(...hourlyTrend.map((d) => d.volume), 1);
    for (let i = 0; i < hourlyTrend.length; i++) {
      if (hourlyTrend[i].volume === 0) continue;
      const barH = (hourlyTrend[i].volume / maxVol) * 30;
      const x = padding.left + (chartW / Math.max(dataLen - 1, 1)) * i - 3;
      ctx.fillStyle = hourlyTrend[i].sentiment >= 0 ? "rgba(59, 130, 246, 0.25)" : "rgba(239, 68, 68, 0.25)";
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

    // Data points with sentiment colors
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = p.sentiment >= 0.15 ? "#22c55e" : p.sentiment <= -0.15 ? "#ef4444" : "#eab308";
      ctx.fill();
      ctx.strokeStyle = "#0a0e1a";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [hourlyTrend]);

  return (
    <div className="bg-[#1a2235] rounded-xl p-5 card-glow border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Sentiment Timeline</h2>
          <p className="text-xs text-slate-500">Hourly sentiment score (IST) across all sources</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-slate-500">Positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-[10px] text-slate-500">Neutral</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-slate-500">Negative</span>
          </div>
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
