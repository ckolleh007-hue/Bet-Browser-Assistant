import React from 'react';
import { BetSlipState, BetRequestRecord } from '../../server/src/types/index.ts';
import { SafetyBarrierBanner } from './SafetyBarrierBanner.tsx';
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface BetSlipViewProps {
  slip: BetSlipState;
  activeBetRequest: BetRequestRecord | null;
  onEmergencyStop: () => void;
  onRefreshSlip: () => void;
}

export const BetSlipView: React.FC<BetSlipViewProps> = ({
  slip,
  activeBetRequest,
  onEmergencyStop,
  onRefreshSlip,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* If final confirmation reached, display mandatory Safety Barrier */}
      {slip.finalConfirmationReached && (
        <SafetyBarrierBanner
          slip={slip}
          onEmergencyStop={onEmergencyStop}
          onBetConfirmed={onRefreshSlip}
        />
      )}

      {/* Main Bet Slip Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Active Bet Slip</h2>
              <p className="text-xs text-zinc-400">
                NiceBet Liberia Live Bet Slip & Verification Status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono">Mode:</span>
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-400 rounded-lg border border-emerald-500/30">
              Live Sportsbook (nicebet.com.lr)
            </span>
          </div>
        </div>

        {slip.items.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 space-y-2">
            <Receipt className="w-12 h-12 mx-auto text-zinc-700" />
            <p className="text-sm">Your bet slip is currently empty.</p>
            <p className="text-xs text-zinc-600">
              Enter instructions in the &quot;New Bet&quot; page or click odds directly in the NiceBet Sportsbook.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* List of Selections */}
            <div className="space-y-3">
              {slip.items.map((item, index) => (
                <div
                  key={`${item.eventId}-${index}`}
                  className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono text-zinc-500 uppercase">
                      Selection {index + 1}
                    </div>
                    <div className="text-sm font-bold text-white">{item.eventTitle}</div>
                    <div className="text-xs text-zinc-400">Market: {item.marketName}</div>
                    <div className="text-xs font-semibold text-emerald-400">
                      Selection: {item.selection}
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-6">
                    <div className="text-[10px] uppercase font-mono text-zinc-500">Odds</div>
                    <div className="text-lg font-mono font-black text-amber-400">
                      {item.odds.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Card */}
            <div className="bg-zinc-950/80 p-5 rounded-xl border border-zinc-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
                <div className="pt-2 sm:pt-0 sm:pr-4">
                  <div className="text-xs text-zinc-500 font-mono uppercase">Stake Amount</div>
                  <div className="text-xl font-black text-white mt-1">
                    ${slip.stake.toFixed(2)} <span className="text-xs font-normal text-zinc-400">{slip.currency}</span>
                  </div>
                </div>

                <div className="pt-2 sm:pt-0 sm:px-4">
                  <div className="text-xs text-zinc-500 font-mono uppercase">Combined Odds</div>
                  <div className="text-xl font-black text-amber-400 mt-1">
                    {slip.totalOdds.toFixed(2)}
                  </div>
                </div>

                <div className="pt-2 sm:pt-0 sm:pl-4">
                  <div className="text-xs text-emerald-400/90 font-mono uppercase">Potential Return</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    ${slip.potentialReturn.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Regulatory / Testing Disclaimer */}
              <div className="text-[11px] text-zinc-500 italic bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                Notice: Potential returns are calculated based on mathematical parlay multiplication ({slip.stake} × {slip.totalOdds}). This does NOT imply guaranteed winnings. For development and simulation testing only.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification Engine Inspector */}
      {activeBetRequest && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">
                Verification Engine Inspector
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-mono">Agent Status:</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  activeBetRequest.status === 'WAITING FOR REVIEW'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : activeBetRequest.status === 'RUNNING'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : activeBetRequest.status === 'ERROR'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {activeBetRequest.status}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-zinc-400">
              Comparison between user instructions and active bet slip:
            </div>

            <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
              {activeBetRequest.selections.map((sel, idx) => {
                const isFoundInSlip = slip.items.some(
                  (i) =>
                    i.eventTitle.toLowerCase().includes(sel.event.toLowerCase()) ||
                    sel.event.toLowerCase().includes(i.eventTitle.toLowerCase())
                );
                return (
                  <div
                    key={sel.id || idx}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-white flex items-center gap-2">
                        {isFoundInSlip ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-zinc-500" />
                        )}
                        <span>{sel.event}</span>
                      </div>
                      <div className="text-zinc-400 font-mono">
                        Requested: {sel.market} &gt; {sel.selection}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                          sel.status === 'ADDED' || isFoundInSlip
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : sel.status === 'FAILED'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isFoundInSlip ? '✓ MATCH' : sel.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
