import React, { useState } from 'react';
import { BrowserActionState, BetSlipState } from '../../server/src/types/index.ts';
import {
  Globe,
  Play,
  Square,
  AlertOctagon,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Camera,
} from 'lucide-react';
import { startBrowser, stopBrowser, stopBetAgent } from '../api.ts';

interface BrowserViewProps {
  browserState: BrowserActionState;
  isAgentRunning: boolean;
  slip: BetSlipState;
  onRefresh: () => void;
  onStartAgentTab: () => void;
}

export const BrowserView: React.FC<BrowserViewProps> = ({
  browserState,
  isAgentRunning,
  slip,
  onRefresh,
  onStartAgentTab,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartBrowser = async () => {
    setIsLoading(true);
    try {
      await startBrowser();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBrowser = async () => {
    setIsLoading(true);
    try {
      await stopBrowser();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAgent = async () => {
    try {
      await stopBetAgent();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Control Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Playwright Browser Panel</h2>
              <p className="text-xs text-zinc-400">
                Chromium Engine targeting NiceBet Liberia (nicebet.com.lr)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleStartBrowser}
              disabled={isLoading || browserState.connectionStatus === 'Connected'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-40 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>START BROWSER</span>
            </button>

            <button
              onClick={handleStopBrowser}
              disabled={isLoading || browserState.connectionStatus !== 'Connected'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 disabled:opacity-40 transition cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-zinc-400" />
              <span>STOP BROWSER</span>
            </button>

            <button
              onClick={onStartAgentTab}
              disabled={isAgentRunning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition shadow-md shadow-emerald-900/30 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>START AGENT</span>
            </button>

            <button
              onClick={handleStopAgent}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-md shadow-red-900/30 cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>STOP AGENT</span>
            </button>
          </div>
        </div>

        {/* 4 Key Properties Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Browser</div>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              {browserState.browserType}
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Target Sportsbook</div>
            <div className="text-sm font-bold text-emerald-400 mt-1 truncate" title="NiceBet Liberia">
              NiceBet Liberia
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Connection</div>
            <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  browserState.connectionStatus === 'Connected'
                    ? 'bg-emerald-400'
                    : 'bg-zinc-600'
                }`}
              ></span>
              {browserState.connectionStatus}
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
            <div className="text-[10px] uppercase font-mono text-zinc-500">Agent Status</div>
            <div
              className={`text-sm font-bold mt-1 ${
                isAgentRunning ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'
              }`}
            >
              {isAgentRunning ? 'Running' : 'Stopped'}
            </div>
          </div>
        </div>

        {/* Current URL & Action */}
        <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
            <span className="text-zinc-500 uppercase">Target URL:</span>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 truncate font-semibold">
                {browserState.currentUrl || 'https://www.nicebet.com.lr/en/sports'}
              </span>
              <a
                href="https://www.nicebet.com.lr/en/sports"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white"
                title="Open NiceBet in external tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-zinc-500 uppercase">Current Action:</span>
            <span className="text-amber-300 font-semibold truncate">
              {browserState.currentAction}
            </span>
          </div>
        </div>
      </div>

      {/* Live Viewport Representation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/70 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/70 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/70 inline-block"></span>
            </div>
            <span className="text-xs font-mono text-zinc-400 ml-2">
              Chromium Headless Viewport — nicebet.com.lr (1280 x 800)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              SAFETY INTERCEPTOR ACTIVE
            </span>
          </div>
        </div>

        {/* Live Screenshot if available from Playwright */}
        {browserState.screenshotBase64 ? (
          <div className="p-2 bg-zinc-950">
            <div className="flex items-center justify-between px-3 py-1.5 text-xs text-zinc-400 border-b border-zinc-800/60 mb-2">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Camera className="w-3.5 h-3.5" />
                <span>Live Chromium Render of https://www.nicebet.com.lr/en/sports</span>
              </div>
              <span className="text-zinc-500 font-mono text-[10px]">Playwright Frame Buffer</span>
            </div>
            <div className="rounded-xl overflow-hidden border border-zinc-800 max-h-[500px] overflow-y-auto">
              <img
                src={browserState.screenshotBase64}
                alt="NiceBet live screenshot"
                className="w-full object-top"
              />
            </div>
          </div>
        ) : (
          /* Structured Viewport Content */
          <div className="p-6 bg-zinc-950/90 font-sans space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <div className="text-xs uppercase font-mono text-zinc-500">Sportsbook Engine</div>
                <div className="text-lg font-bold text-white">NICEBET LIBERIA (nicebet.com.lr)</div>
              </div>
              <div className="text-xs bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
                Active Slip Items: <strong className="text-emerald-400">{slip.items.length}</strong>
              </div>
            </div>

            {/* Browser State Notice */}
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs text-zinc-400 font-mono">Agent Status Feedback:</div>
                  <div className="text-sm font-semibold text-white">{browserState.currentAction}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Total Odds</div>
                <div className="text-base font-bold font-mono text-amber-400">{slip.totalOdds.toFixed(2)}</div>
              </div>
            </div>

            {/* Synchronized Active Selections */}
            <div className="space-y-2">
              <div className="text-xs uppercase font-mono text-zinc-500">
                Synchronized Selections in NiceBet Bet Slip:
              </div>
              {slip.items.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                  No active selections in NiceBet slip. Run the agent or select matches to populate.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {slip.items.map((item, i) => (
                    <div
                      key={i}
                      className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{item.eventTitle}</div>
                        <div className="text-zinc-400">{item.marketName}</div>
                        <div className="text-emerald-400 font-semibold">{item.selection}</div>
                      </div>
                      <div className="text-right font-mono font-bold text-amber-400 text-sm">
                        {item.odds.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
