import React from 'react';
import {
  AgentStatus,
  BrowserActionState,
  BetSlipState,
  BetRequestRecord,
} from '../../server/src/types/index.ts';
import {
  Play,
  ShieldCheck,
  Receipt,
  Globe,
  ScrollText,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface DashboardHomeProps {
  agentStatus: AgentStatus;
  browserState: BrowserActionState;
  slip: BetSlipState;
  history: BetRequestRecord[];
  onNavigate: (tab: any) => void;
  onEmergencyStop: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  agentStatus,
  browserState,
  slip,
  history,
  onNavigate,
  onEmergencyStop,
}) => {
  const getStatusDisplay = () => {
    switch (agentStatus) {
      case 'RUNNING':
        return {
          title: 'RUNNING',
          desc: 'Playwright agent is navigating NiceBet (nicebet.com.lr) and assembling your selections.',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        };
      case 'VERIFYING':
        return {
          title: 'VERIFYING',
          desc: 'Verification engine is comparing requested selections against actual bet slip.',
          badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
        };
      case 'WAITING FOR REVIEW':
        return {
          title: 'WAITING FOR REVIEW',
          desc: 'Bet slip is ready. Agent has stopped before transaction. Manual confirmation required.',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'STOPPED':
        return {
          title: 'STOPPED',
          desc: 'Execution halted by emergency stop or completed task.',
          badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
        };
      case 'ERROR':
        return {
          title: 'ERROR / SELECTION MISMATCH',
          desc: 'A requested market or selection was not found or failed validation.',
          badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
        };
      case 'READY':
      default:
        return {
          title: 'READY',
          desc: 'Ready to receive natural language betting instructions.',
          badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Current State Hero Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-zinc-400">Assistant State:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${statusInfo.badgeColor}`}
              >
                {statusInfo.title}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Bet Browser Assistant
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl">{statusInfo.desc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('auto-pick')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer ring-1 ring-emerald-400/50"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Auto Pick (2.00–2.14)</span>
            </button>

            <button
              onClick={() => onNavigate('new-bet')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition active:scale-95 cursor-pointer"
            >
              <span>Custom Bet</span>
            </button>

            <button
              onClick={onEmergencyStop}
              className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-red-600/90 hover:bg-red-600 text-white shadow-lg shadow-red-950 transition active:scale-95 cursor-pointer"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>STOP AGENT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase">
            <span>Bet Slip Selections</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {slip.items.length}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {slip.items.length > 0 ? `Total Odds: ${slip.totalOdds.toFixed(2)}` : 'No active selections'}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase">
            <span>Browser Session</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {browserState.browserType}
          </div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            {browserState.connectionStatus}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase">
            <span>Safety Barrier</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            100% Enforced
          </div>
          <div className="text-xs text-amber-400 mt-1">
            Zero auto-submit allowed
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono uppercase">
            <span>Execution Model</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2 font-mono text-base">
            deepseek-chat
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            DeepSeek API structured parsing
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('auto-pick')}
          className="bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500 rounded-2xl p-5 cursor-pointer transition group shadow-lg shadow-emerald-500/5 bg-gradient-to-b from-emerald-950/20 to-zinc-900"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white mt-3">AI Auto Pick</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Autonomous scanning with default options (0-5 & (1-4),(0-2)) filtered for 2.00–2.14 odds.
          </p>
        </div>

        <div
          onClick={() => onNavigate('bet-slip')}
          className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <Receipt className="w-6 h-6" />
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white mt-3">Inspect Bet Slip</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Review the current selections, verify odds, and inspect calculation breakdown.
          </p>
        </div>

        <div
          onClick={() => onNavigate('browser')}
          className="bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 rounded-2xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-cyan-400">
            <Globe className="w-6 h-6" />
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white mt-3">Live Browser Inspector</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Observe Chromium navigating NiceBet (nicebet.com.lr), searching events and adding bets.
          </p>
        </div>

        <div
          onClick={() => onNavigate('sportsbook')}
          className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-amber-400">
            <ShieldCheck className="w-6 h-6" />
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white mt-3">NiceBet Sportsbook</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Explore live matches from nicebet.com.lr, test odds selection, and verify the safety barrier.
          </p>
        </div>
      </div>

      {/* Recent History Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="text-base font-bold text-white">Recent Bet Requests</h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No bet requests yet. Create your first bet in the New Bet section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono uppercase">
                  <th className="py-2.5 px-3">ID / Time</th>
                  <th className="py-2.5 px-3">Stake</th>
                  <th className="py-2.5 px-3">Selections</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Potential Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {history.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-800/30">
                    <td className="py-2.5 px-3 font-mono text-zinc-400">
                      {req.id.slice(0, 12)}...
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      ${req.stake.toFixed(2)} {req.currency}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">
                      {req.selections.length} leg(s)
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold ${
                          req.status === 'WAITING FOR REVIEW'
                            ? 'bg-amber-500/20 text-amber-300'
                            : req.status === 'RUNNING'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : req.status === 'ERROR'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      ${(req.potential_return || req.stake).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
