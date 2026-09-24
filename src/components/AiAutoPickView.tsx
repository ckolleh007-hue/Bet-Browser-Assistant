import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Flame,
  BarChart3,
  Calculator,
  RefreshCw,
  Info,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { generateAiAutoPick, executeAiAutoPick, getLatestAutoPick } from '../api.ts';
import { AiAutoPickResponse } from '../../server/src/types/index.ts';

interface AiAutoPickViewProps {
  onAgentStarted: (betRequestId: string) => void;
  onNavigateToBetSlip?: () => void;
}

interface StepItem {
  id: string;
  title: string;
  detail?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export const AiAutoPickView: React.FC<AiAutoPickViewProps> = ({
  onAgentStarted,
  onNavigateToBetSlip,
}) => {
  const [stake, setStake] = useState<number>(10);
  const [currency] = useState<string>('USD');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isBuildingSlip, setIsBuildingSlip] = useState<boolean>(false);
  const [result, setResult] = useState<AiAutoPickResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [showCombosModal, setShowCombosModal] = useState<boolean>(false);

  // Real-time animation stages defined in Section 16 of the prompt
  const initialSteps: StepItem[] = [
    { id: '1', title: 'Scanning NiceBet...', detail: 'Events found', status: 'pending' },
    { id: '2', title: 'Reading available markets...', detail: 'Markets found', status: 'pending' },
    {
      id: '3',
      title: 'Finding default betting options...',
      detail: 'Multigoals → 0-5 & Multigoals 1 & Multigoals 2 → (1-4),(0-2)',
      status: 'pending',
    },
    {
      id: '4',
      title: 'Analyzing teams and matches...',
      detail: 'Form, H2H, xG, defensive records & lineups',
      status: 'pending',
    },
    { id: '5', title: 'Generating combinations...', detail: 'Combinations evaluated', status: 'pending' },
    { id: '6', title: 'Filtering total odds...', detail: '2.00–2.14 requirement applied', status: 'pending' },
    { id: '7', title: 'Performing final validation...', detail: 'Selection validated', status: 'pending' },
  ];

  const [steps, setSteps] = useState<StepItem[]>(initialSteps);

  // Load latest on mount if available
  useEffect(() => {
    getLatestAutoPick()
      .then((data) => {
        if (data) setResult(data);
      })
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setErrorMsg(null);
    setIsAnalyzing(true);
    setResult(null);

    // Reset steps
    const newSteps: StepItem[] = initialSteps.map((s) => ({ ...s, status: 'pending' }));
    setSteps(newSteps);

    // Step progression animation
    const runStep = (idx: number) => {
      setActiveStepIndex(idx);
      setSteps((prev) =>
        prev.map((step, i) => {
          if (i < idx) return { ...step, status: 'completed' };
          if (i === idx) return { ...step, status: 'in-progress' };
          return { ...step, status: 'pending' };
        })
      );
    };

    try {
      runStep(0);
      await new Promise((r) => setTimeout(r, 400));
      runStep(1);
      await new Promise((r) => setTimeout(r, 450));
      runStep(2);
      await new Promise((r) => setTimeout(r, 500));
      runStep(3);
      await new Promise((r) => setTimeout(r, 600));
      runStep(4);
      await new Promise((r) => setTimeout(r, 500));
      runStep(5);
      await new Promise((r) => setTimeout(r, 450));
      runStep(6);

      const res = await generateAiAutoPick(stake, currency);

      // Finish all steps
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to scan and generate AI auto pick selections');
      setSteps((prev) =>
        prev.map((s, i) => (i === activeStepIndex ? { ...s, status: 'error' } : s))
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBuildBetSlip = async () => {
    if (!result || result.status !== 'QUALIFIED' || result.selections.length === 0) return;

    setIsBuildingSlip(true);
    setErrorMsg(null);

    try {
      const res = await executeAiAutoPick({
        selections: result.selections,
        stake: result.stake || stake,
        currency: result.currency || currency,
      });

      if (res.success && res.betRequestId) {
        onAgentStarted(res.betRequestId);
      } else {
        throw new Error(res.error || 'Failed to launch bet builder');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution error during bet slip automation');
      setIsBuildingSlip(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
              AUTONOMOUS SELECTION ENGINE
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">AI AUTO PICK</h1>
            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
              Autonomous match scanning on NiceBet. Automatically analyzes recent form, H2H, goals,
              and lineups, and selects statistical value combinations strictly within{' '}
              <strong className="text-zinc-200">2.00 – 2.14 total odds</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80">
            <div>
              <span className="text-xs text-zinc-400 uppercase tracking-wider block">
                Target Total Odds
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">2.00 – 2.14</span>
            </div>
            <div className="hidden sm:block w-px h-10 bg-zinc-800"></div>
            <div>
              <span className="text-xs text-zinc-400 uppercase tracking-wider block">Rule</span>
              <span className="text-xs font-medium text-zinc-300">
                Atomic selections, no forced odds
              </span>
            </div>
          </div>
        </div>

        {/* Section 15 Default Betting Options Display */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
              01
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Default Option 1
              </div>
              <div className="text-sm font-semibold text-zinc-200">
                Market: <span className="text-white font-mono">Multigoals</span>
              </div>
              <div className="text-xs text-emerald-400 font-mono font-bold">
                Selection: 0-5{' '}
                <span className="text-[11px] text-zinc-500 font-sans font-normal">
                  (Single complete option)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
              02
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                Default Option 2
              </div>
              <div className="text-sm font-semibold text-zinc-200">
                Market: <span className="text-white font-mono">Multigoals 1 & Multigoals 2</span>
              </div>
              <div className="text-xs text-emerald-400 font-mono font-bold">
                Selection: (1-4),(0-2){' '}
                <span className="text-[11px] text-zinc-500 font-sans font-normal">
                  (Atomic selection — not split)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stake input & Action Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-medium text-zinc-300 whitespace-nowrap">Stake:</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-zinc-400 text-sm font-mono">$</span>
              <input
                type="number"
                min="1"
                max="5000"
                step="1"
                value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value) || 1))}
                disabled={isAnalyzing || isBuildingSlip}
                className="w-32 bg-zinc-900 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="text-xs text-zinc-500 flex-1 hidden sm:block">
            You do NOT manually select teams. The AI scans all active NiceBet events and selects the
            statistically supported combination.
          </div>

          <button
            onClick={handleGenerate}
            disabled={isAnalyzing || isBuildingSlip}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                ANALYZING NICEBET...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                GENERATE AI SELECTION
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Execution Notice</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Section 16 Analysis Screen during processing */}
      {isAnalyzing && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
              NiceBet Autonomous Analysis in Progress
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Live Stage Verification</span>
          </div>

          <div className="space-y-3 font-mono text-sm">
            {steps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in-progress';
              const isError = step.status === 'error';

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : isInProgress
                      ? 'bg-zinc-800/80 border-emerald-500/50 text-white animate-pulse'
                      : isError
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-500'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isInProgress ? (
                      <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-700"></div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-semibold">{step.title}</span>
                    {isCompleted && step.detail && (
                      <span className="text-xs text-emerald-400">✓ {step.detail}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 17 Final AI Result or Rejection Screen */}
      {result && !isAnalyzing && (
        <>
          {result.status === 'NO_QUALIFYING_SELECTION' ? (
            <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  NO QUALIFYING AI SELECTION FOUND
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  No sufficiently supported combination was found within the required{' '}
                  <strong className="text-zinc-200">2.00–2.14</strong> range. The AI will never add
                  weak selections merely to reach odds.
                </p>
                {result.reason && (
                  <div className="p-3 bg-zinc-950 rounded-lg text-xs font-mono text-zinc-400 text-left border border-zinc-800 mt-2">
                    {result.reason}
                  </div>
                )}
              </div>
              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition cursor-pointer"
                >
                  Rescan NiceBet Markets
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8">
              {/* Result Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    QUALIFIED COMBINATION GENERATED
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    AI GENERATED SELECTION
                  </h2>
                </div>

                <div className="flex items-center gap-4 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="text-right">
                    <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                      Combined Odds
                    </div>
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      {result.combinedOdds.toFixed(2)}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-zinc-800"></div>
                  <div className="text-left">
                    <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                      Range Check
                    </div>
                    <div className="text-xs font-semibold text-emerald-400">
                      2.00 ≤ {result.combinedOdds.toFixed(2)} ≤ 2.14 ✓
                    </div>
                  </div>
                </div>
              </div>

              {/* Selections Cards */}
              <div className="space-y-4">
                {result.selections.map((sel, idx) => (
                  <div
                    key={sel.eventId + idx}
                    className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-5 space-y-3 hover:border-zinc-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-base font-bold text-white">{sel.teams}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                          Confidence: {Math.round(sel.confidence * 100)}%
                        </span>
                        <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-base">
                          {sel.odds.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60">
                      <div>
                        <span className="text-zinc-500 block font-medium">Market:</span>
                        <span className="text-zinc-200 font-semibold">{sel.market}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block font-medium">Selection:</span>
                        <span className="text-emerald-400 font-bold font-mono text-sm">
                          {sel.selection}
                        </span>
                      </div>
                    </div>

                    {/* AI Analysis Explanation */}
                    <div className="space-y-1 pt-1">
                      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                        AI Statistical Analysis (Actual Data)
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/40">
                        {sel.analysis}
                      </p>
                      {sel.statsSummary && (
                        <div className="text-[11px] text-zinc-400 font-mono px-2 pt-1">
                          📊 {sel.statsSummary}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Combined Odds Calculation & Return */}
              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                    Combined Odds Calculation
                  </div>
                  <div className="font-mono text-sm text-zinc-300">
                    {result.selections.map((s) => s.odds.toFixed(2)).join(' × ')} ={' '}
                    <strong className="text-emerald-400 text-lg font-bold">
                      {result.combinedOdds.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                      Stake
                    </div>
                    <div className="text-base font-bold text-white font-mono">
                      ${stake.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                      Potential Return
                    </div>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      ${(stake * result.combinedOdds).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Safety Notice */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleBuildBetSlip}
                    disabled={isBuildingSlip}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {isBuildingSlip ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        BUILDING NICEBET BET SLIP...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 text-zinc-950" />
                        BUILD NICEBET BET SLIP (AUTOMATED)
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowCombosModal(true)}
                    className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Layers className="w-4 h-4" />
                    Audit Combinations ({result.totalCombinationsGenerated})
                  </button>
                </div>

                {/* Section 19 Safety Barrier Banner */}
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-zinc-200">
                      Automated Slip Building with Real-Money Safety Barrier
                    </div>
                    <div className="text-zinc-500 leading-relaxed">
                      The browser agent scans NiceBet, selects the exact markets, reads live odds,
                      enters the stake, and verifies the bet slip. It will{' '}
                      <strong className="text-zinc-300">
                        NEVER click Place Bet or final transaction buttons
                      </strong>
                      . It will stop at the confirmation screen waiting for your manual review.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Combinations Audit Modal */}
      {showCombosModal && result && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Candidate Combinations Audit</h3>
                <p className="text-xs text-zinc-400">
                  Total generated: {result.totalCombinationsGenerated} | Qualifying: {result.qualifyingCombinationsCount}
                </p>
              </div>
              <button
                onClick={() => setShowCombosModal(false)}
                className="text-zinc-400 hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2 text-xs font-mono">
              {result.allCombinations.map((combo, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                    combo.qualifies
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="truncate flex-1">
                    <span className="text-zinc-300 font-semibold">{combo.summary}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold ${combo.qualifies ? 'text-emerald-400' : 'text-zinc-500'}`}
                    >
                      Odds: {combo.odds.toFixed(2)}
                    </span>
                    <span className="block text-[10px] text-zinc-400">{combo.reason}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950 text-right">
              <button
                onClick={() => setShowCombosModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
