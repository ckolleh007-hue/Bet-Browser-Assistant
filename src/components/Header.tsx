import React from 'react';
import { BrowserStatus } from '../../server/src/types/index.ts';
import { AlertOctagon, ShieldCheck, Activity, Globe } from 'lucide-react';

interface HeaderProps {
  browserStatus: BrowserStatus;
  isAgentRunning: boolean;
  onEmergencyStop: () => void;
  onOpenSportsbook: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  browserStatus,
  isAgentRunning,
  onEmergencyStop,
  onOpenSportsbook,
}) => {
  const getStatusBadge = () => {
    switch (browserStatus) {
      case 'Agent Running':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Agent Running
          </span>
        );
      case 'Waiting for Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Waiting for Review
          </span>
        );
      case 'Browser Ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            Browser Ready
          </span>
        );
      case 'Stopped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Stopped
          </span>
        );
      case 'Browser Offline':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
            Browser Offline
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-zinc-950 font-bold shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Bet Browser Assistant
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                Safe Testing Mode
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">
              Autonomous Playwright Slip Builder & Safety Barrier
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800/80">
            <span className="text-xs text-zinc-500">Status:</span>
            {getStatusBadge()}
          </div>

          {/* Quick NiceBet Sportsbook Button */}
          <button
            onClick={onOpenSportsbook}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition"
            title="Open Interactive NiceBet Sportsbook (nicebet.com.lr)"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>NiceBet (nicebet.com.lr)</span>
          </button>

          {/* Prominent Red STOP AGENT Button */}
          <button
            onClick={onEmergencyStop}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide uppercase shadow-lg transition-all active:scale-95 cursor-pointer ${
              isAgentRunning
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 ring-2 ring-red-400 animate-bounce'
                : 'bg-red-600/80 hover:bg-red-600 text-white shadow-red-900/20'
            }`}
            title="Immediately halt all Playwright browser tasks"
          >
            <AlertOctagon className="w-4 h-4 text-white" />
            <span>STOP AGENT</span>
          </button>
        </div>
      </div>
    </header>
  );
};
