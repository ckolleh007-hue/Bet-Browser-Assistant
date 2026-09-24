import React, { useState } from 'react';
import { BetSlipState } from '../../server/src/types/index.ts';
import { ShieldCheck, AlertTriangle, CheckCircle2, UserCheck, AlertOctagon } from 'lucide-react';
import { confirmBetManually } from '../api.ts';

interface SafetyBarrierBannerProps {
  slip: BetSlipState;
  onEmergencyStop: () => void;
  onBetConfirmed: () => void;
}

export const SafetyBarrierBanner: React.FC<SafetyBarrierBannerProps> = ({
  slip,
  onEmergencyStop,
  onBetConfirmed,
}) => {
  const [isConfirmedHuman, setIsConfirmedHuman] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleManualConfirm = async () => {
    if (!isConfirmedHuman) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await confirmBetManually();
      setFeedback(res.message);
      onBetConfirmed();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-amber-500/10 via-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl shadow-amber-500/10 relative overflow-hidden">
      {/* Decorative safety striping */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 animate-pulse" />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                Final Transaction Safety Barrier Enforced
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                BET SLIP READY
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-mono text-amber-400">Status</div>
              <div className="text-xs font-bold text-amber-300">
                WAITING FOR MANUAL CONFIRMATION
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Box */}
        <div className="bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 text-sm text-zinc-300 space-y-2">
          <p className="font-semibold text-white">
            Your selections have been prepared and verified against requested instructions.
          </p>
          <p className="text-zinc-400 text-xs leading-relaxed">
            The Playwright automation has deliberately <strong>STOPPED</strong> before the final transaction screen. By design, the assistant cannot click &quot;PLACE BET&quot;. Please review the prepared slip below and decide whether to manually confirm.
          </p>
        </div>

        {/* Review Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/60">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50 text-zinc-400 font-mono uppercase text-[11px]">
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Market</th>
                <th className="py-2.5 px-3">Selection</th>
                <th className="py-2.5 px-3 text-right">Odds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {slip.items.map((item, idx) => (
                <tr key={`${item.eventId}-${idx}`} className="hover:bg-zinc-800/30 transition">
                  <td className="py-2.5 px-3 font-medium text-white">{item.eventTitle}</td>
                  <td className="py-2.5 px-3 text-zinc-400">{item.marketName}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                      {item.selection}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                    {item.odds.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-700 bg-zinc-950/80 font-semibold text-zinc-300">
                <td colSpan={3} className="py-3 px-3 text-right text-xs uppercase font-mono text-zinc-400">
                  Combined Odds:
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                  {slip.totalOdds.toFixed(2)}
                </td>
              </tr>
              <tr className="bg-zinc-950/80 font-semibold text-zinc-300">
                <td colSpan={3} className="py-2 px-3 text-right text-xs uppercase font-mono text-zinc-400">
                  Stake Amount:
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold text-white">
                  ${slip.stake.toFixed(2)} {slip.currency}
                </td>
              </tr>
              <tr className="bg-emerald-950/30 font-bold border-t border-emerald-500/20">
                <td colSpan={3} className="py-3 px-3 text-right text-xs uppercase font-mono text-emerald-300">
                  Potential Return:
                </td>
                <td className="py-3 px-3 text-right font-mono text-base font-black text-emerald-400">
                  ${slip.potentialReturn.toFixed(2)} {slip.currency}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {slip.betPlaced ? (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold">Manual Confirmation Completed!</div>
              <div className="text-xs text-emerald-400/80">
                Bet slip was confirmed by human user. Automation remained strictly halted throughout.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Human Confirmation Requirement */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmedHuman}
                  onChange={(e) => setIsConfirmedHuman(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-xs text-zinc-300 leading-normal">
                  <strong>Human verification acknowledgement:</strong> I have manually inspected the Event, Market, Selection, Odds, and Stake. I understand this application is for development & testing and the agent is physically barred from submitting this transaction.
                </span>
              </label>

              {feedback && (
                <div className="text-xs font-mono p-2 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                  {feedback}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={onEmergencyStop}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-900/30 cursor-pointer transition active:scale-95"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>STOP AGENT</span>
              </button>

              <button
                onClick={handleManualConfirm}
                disabled={!isConfirmedHuman || isSubmitting}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm tracking-wide shadow-xl transition active:scale-95 cursor-pointer ${
                  isConfirmedHuman && !isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                }`}
                title="Only human users can trigger this manual confirmation"
              >
                <UserCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Confirming...' : 'MANUAL CONFIRM: PLACE BET (HUMAN ONLY)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
