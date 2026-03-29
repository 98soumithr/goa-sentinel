"use client";

import { useSession, signOut } from "next-auth/react";

interface HeaderProps {
  connected: boolean;
  lastUpdate: Date;
  alertCount: number;
  criticalCount: number;
}

export function Header({ connected, lastUpdate, alertCount, criticalCount }: HeaderProps) {
  const { data: session } = useSession();
  return (
    <header className="bg-[#111827] border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
            GS
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              GOA SENTINEL
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              Tourism Sentiment Command Centre
            </p>
          </div>
        </div>

        {/* Center: Live indicator */}
        <div className="hidden md:flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              connected ? "bg-green-500 pulse-dot" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-slate-400">
            {connected ? "LIVE" : "RECONNECTING..."}
          </span>
          <span className="text-xs text-slate-600 ml-2">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>

        {/* Right: Alert badge */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-sm text-slate-300">Alerts</span>
              {alertCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  criticalCount > 0
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {alertCount}
                </span>
              )}
            </button>
          </div>

          {session?.user && (
            <div className="flex items-center gap-3 hidden lg:flex">
              <div className="text-right">
                <p className="text-xs text-slate-500">{(session.user as any).role ?? "Admin"}</p>
                <p className="text-sm text-slate-300">{session.user.name ?? "User"}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
