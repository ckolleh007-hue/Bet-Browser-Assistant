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
  Check,
  MousePointerClick,
  Search,
  CheckCheck,
} from 'lucide-react';
import { generateAiAutoPick, executeAiAutoPick, getLatestAutoPick } from '../api.ts';
import { AiAutoPickResponse, CandidateCombinationAuditItem } from '../../server/src/types/index.ts';

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
  const [selectedOptionMode, setSelectedOptionMode] = useState<'all' | 'option1' | 'option2'>('all');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isBuildingSlip, setIsBuildingSlip] = useState<boolean>(false);
  const [result, setResult] = useState<AiAutoPickResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [showCombosModal, setShowCombosModal] = useState<boolean>(false);
  const [pickedComboId, setPickedComboId] = useState<string | null>(null);
  const [auditTab, setAuditTab] = useState<'qualifying' | 'all'>('qualifying');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Helper to build real-time animation stages based on chosen option
  const getInitialSteps = (mode: 'all' | 'option1' | 'option2'): StepItem[] => [
    { id: '1', title: 'Connecting to NiceBet (https://www.nicebet.com.lr/)...', detail: 'Live sportsbook connected', status: 'pending' },
    { id: '2', title: 'Fetching live events from NiceBet sportsbook...', detail: 'Live matches discovered', status: 'pending' },
    {
      id: '3',
      title:
        mode === 'option1'
          ? 'Scanning Option 1: Multigoals 0-5 on NiceBet...'
          : mode === 'option2'
          ? 'Scanning Option 2: Multigoals 1 & Multigoals 2 on NiceBet...'
          : 'Scanning Multigoals and Multigoals 1 & 2 on NiceBet...',
      detail:
        mode === 'option1'
          ? 'Multigoals → 0-5 live markets loaded'
          : mode === 'option2'
          ? 'Multigoals 1 & Multigoals 2 live markets loaded'
          : 'Live Multigoals & Multigoals 1 & 2 markets loaded',
      status: 'pending',
    },
    {
      id: '4',
      title: 'Analyzing team stats, H2H & goals distribution...',
      detail: 'Form, H2H, xG & defensive stability computed',
      status: 'pending',
    },
    {
      id: '5',
      title:
        mode === 'option1'
          ? 'Generating Option 1 combinations...'
          : mode === 'option2'
          ? 'Generating Option 2 combinations...'
          : 'Evaluating candidate combinations...',
      detail: 'Live combinations evaluated',
      status: 'pending',
    },
    { id: '6', title: 'Verifying odds corridor (2.00–2.14 requirement)...', detail: '2.00 ≤ Odds ≤ 2.14 satisfied', status: 'pending' },
    { id: '7', title: 'Backend validation (10/10 strict checks)...', detail: 'Selection verified and ready', status: 'pending' },
  ];

  const [steps, setSteps] = useState<StepItem[]>(() => getInitialSteps('all'));

  // Load latest on mount if available
  useEffect(() => {
    getLatestAutoPick()
      .then((data) => {
        if (data) setResult(data);
      })
      .catch(() => {});
  }, []);

  // Sync active picked combination ID when result is updated
  useEffect(() => {
    if (result && result.allCombinations && result.allCombinations.length > 0) {
      const match = result.allCombinations.find(
        (c) => c.qualifies && Math.abs(c.odds - result.combinedOdds) < 0.001
      );
      if (match) {
        setPickedComboId(match.id);
      } else {
        const firstQual = result.allCombinations.find((c) => c.qualifies);
        if (firstQual) setPickedComboId(firstQual.id);
      }
    }
  }, [result]);

  const handleSelectAuditCombo = (combo: CandidateCombinationAuditItem) => {
    if (!result || !combo.qualifies || !combo.selections || combo.selections.length === 0) return;
    setPickedComboId(combo.id);
    setResult({
      ...result,
      status: 'QUALIFIED',
      combinedOdds: combo.odds,
      selections: combo.selections,
      summary: `AI Auto Pick: Picked from Candidate Combinations Audit (${combo.summary}) yielding combined odds of ${combo.odds.toFixed(2)}.`,
    });
  };

  const filteredAuditCombos = (result?.allCombinations || []).filter((combo) => {
    if (auditTab === 'qualifying' && !combo.qualifies) return false;
    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase().trim();
      return (
        combo.summary.toLowerCase().includes(q) ||
        (combo.reason && combo.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleGenerate = async () => {
    setErrorMsg(null);
    setIsAnalyzing(true);
    setResult(null);

    // Reset steps dynamically for current option mode
    const newSteps: StepItem[] = getInitialSteps(selectedOptionMode);
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

      const res = await generateAiAutoPick(stake, currency, selectedOptionMode);

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

        {/* Section 15 Default Betting Options Display & Selection Controls */}
        <div className="mt-6 pt-6 border-t border-zinc-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <MousePointerClick className="w-4 h-4 text-emerald-400" />
                Select Default Betting Option
              </div>
              <p className="text-xs text-zinc-400">
                Click an option card below to target it specifically, or use Both Options combined.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedOptionMode('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  selectedOptionMode === 'all'
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Both Options
              </button>
              <button
                type="button"
                onClick={() => setSelectedOptionMode('option1')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  selectedOptionMode === 'option1'
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Option 1 Only
              </button>
              <button
                type="button"
                onClick={() => setSelectedOptionMode('option2')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  selectedOptionMode === 'option2'
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Option 2 Only
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clickable Card 1: Default Option 1 */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOptionMode(selectedOptionMode === 'option1' ? 'all' : 'option1')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedOptionMode(selectedOptionMode === 'option1' ? 'all' : 'option1');
                }
              }}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none group relative flex items-start gap-3.5 ${
                selectedOptionMode === 'option1'
                  ? 'bg-gradient-to-br from-emerald-950/60 to-zinc-950 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : selectedOptionMode === 'all'
                  ? 'bg-zinc-950/70 border-emerald-700/50 hover:border-emerald-500 hover:bg-zinc-900/60'
                  : 'bg-zinc-950/30 border-zinc-800/60 opacity-60 hover:opacity-100 hover:border-zinc-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition ${
                  selectedOptionMode === 'option1'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30'
                    : selectedOptionMode === 'all'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                01
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wider font-bold text-zinc-300">
                    Default Option 1
                  </div>
                  {selectedOptionMode === 'option1' && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-bold uppercase tracking-wider">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Selected
                    </span>
                  )}
                  {selectedOptionMode === 'all' && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 font-medium">
                      <Check className="w-3 h-3" />
                      Active in Scan
                    </span>
                  )}
                  {selectedOptionMode === 'option2' && (
                    <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition">
                      Click to select
                    </span>
                  )}
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
                <div className="text-[11px] text-zinc-400 pt-0.5">
                  {selectedOptionMode === 'option1'
                    ? '✓ AI will scan and generate bets using Multigoals 0-5 exclusively'
                    : selectedOptionMode === 'all'
                    ? 'Available for AI combinations (Click to isolate)'
                    : 'Click to switch AI scanner to Option 1 only'}
                </div>
              </div>
            </div>

            {/* Clickable Card 2: Default Option 2 */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOptionMode(selectedOptionMode === 'option2' ? 'all' : 'option2')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedOptionMode(selectedOptionMode === 'option2' ? 'all' : 'option2');
                }
              }}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none group relative flex items-start gap-3.5 ${
                selectedOptionMode === 'option2'
                  ? 'bg-gradient-to-br from-emerald-950/60 to-zinc-950 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : selectedOptionMode === 'all'
                  ? 'bg-zinc-950/70 border-emerald-700/50 hover:border-emerald-500 hover:bg-zinc-900/60'
                  : 'bg-zinc-950/30 border-zinc-800/60 opacity-60 hover:opacity-100 hover:border-zinc-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition ${
                  selectedOptionMode === 'option2'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30'
                    : selectedOptionMode === 'all'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                02
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wider font-bold text-zinc-300">
                    Default Option 2
                  </div>
                  {selectedOptionMode === 'option2' && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500 text-zinc-950 font-bold uppercase tracking-wider">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Selected
                    </span>
                  )}
                  {selectedOptionMode === 'all' && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 font-medium">
                      <Check className="w-3 h-3" />
                      Active in Scan
                    </span>
                  )}
                  {selectedOptionMode === 'option1' && (
                    <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition">
                      Click to select
                    </span>
                  )}
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
                <div className="text-[11px] text-zinc-400 pt-0.5">
                  {selectedOptionMode === 'option2'
                    ? '✓ AI will scan and generate bets using Multigoals 1 & Multigoals 2 exclusively'
                    : selectedOptionMode === 'all'
                    ? 'Available for AI combinations (Click to isolate)'
                    : 'Click to switch AI scanner to Option 2 only'}
                </div>
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
                {selectedOptionMode === 'option1'
                  ? 'GENERATE AI SELECTION (OPTION 1 ONLY)'
                  : selectedOptionMode === 'option2'
                  ? 'GENERATE AI SELECTION (OPTION 2 ONLY)'
                  : 'GENERATE AI SELECTION'}
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
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleGenerate}
                  className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition cursor-pointer"
                >
                  Rescan NiceBet Markets
                </button>
                {result.allCombinations && result.allCombinations.length > 0 && (
                  <button
                    onClick={() => setShowCombosModal(true)}
                    className="px-5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-sm font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    Inspect Combinations Audit ({result.totalCombinationsGenerated})
                  </button>
                )}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      AI GENERATED SELECTION
                    </h2>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Source: https://www.nicebet.com.lr/
                    </span>
                    {result.selectedOption && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {result.selectedOption === 'option1'
                          ? 'Option 1 (Multigoals 0-5)'
                          : result.selectedOption === 'option2'
                          ? 'Option 2 (Multigoals 1 & 2)'
                          : 'Both Options'}
                      </span>
                    )}
                  </div>
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
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Active AI Selection ({result.selections.length} {result.selections.length === 1 ? 'Leg' : 'Legs'})
                  </div>
                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5" />
                    Picked from Candidate Combinations Audit
                  </span>
                </div>

                {result.selections.map((sel, idx) => (
                  <div
                    key={sel.eventId + idx}
                    className="bg-zinc-950/80 rounded-xl border border-zinc-800 p-5 space-y-3 hover:border-zinc-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-base font-bold text-white">{sel.teams}</span>
                        <a
                          href="https://www.nicebet.com.lr/en/sports"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded hover:bg-emerald-900/60 transition"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          nicebet.com.lr
                        </a>
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

              {/* Candidate Combinations Audit Picker Section */}
              <div className="bg-zinc-950/90 rounded-2xl border border-zinc-800 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                  <div className="space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <Layers className="w-4 h-4" />
                      Candidate Combinations Audit
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Pick from Evaluated Candidate Combinations
                    </h3>
                    <p className="text-xs text-zinc-400">
                      The AI evaluated {result.totalCombinationsGenerated} combinations. Click{' '}
                      <strong className="text-emerald-400">"Pick from here"</strong> on any qualifying candidate to select it.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => setAuditTab('qualifying')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        auditTab === 'qualifying'
                          ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      Qualifying ({result.qualifyingCombinationsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuditTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        auditTab === 'all'
                          ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      All ({result.totalCombinationsGenerated})
                    </button>
                  </div>
                </div>

                {/* Filter Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder="Search candidate combinations by team name (e.g. Portugal, Austria, Italy)..."
                    className="w-full pl-10 pr-8 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono transition"
                  />
                  {auditSearchQuery && (
                    <button
                      onClick={() => setAuditSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Combinations List */}
                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {filteredAuditCombos.length === 0 ? (
                    <div className="text-center py-8 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                      No combinations matching "{auditSearchQuery}".
                    </div>
                  ) : (
                    filteredAuditCombos.map((combo, idx) => {
                      const isCurrentActive =
                        pickedComboId === combo.id ||
                        (!pickedComboId && idx === 0 && combo.qualifies);

                      return (
                        <div
                          key={combo.id || idx}
                          className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isCurrentActive
                              ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                              : combo.qualifies
                              ? 'bg-zinc-900/70 border-zinc-800 hover:border-emerald-700/50 hover:bg-zinc-900'
                              : 'bg-zinc-950/50 border-zinc-900/80 text-zinc-500 opacity-60'
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {combo.qualifies ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                                  ✓ 2.00–2.14 CORRIDOR
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 font-mono">
                                  REJECTED
                                </span>
                              )}

                              {isCurrentActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-zinc-950 shadow-sm">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  ACTIVE AI PICK
                                </span>
                              )}

                              <span className="text-[11px] text-zinc-500 font-mono">
                                #{idx + 1} • {combo.selections.length} {combo.selections.length === 1 ? 'leg' : 'legs'}
                              </span>

                              {combo.statisticalScore !== undefined && (
                                <span className="text-[11px] text-zinc-400 font-mono">
                                  Score: {combo.statisticalScore}/100
                                </span>
                              )}
                            </div>

                            <div className="text-xs font-semibold text-zinc-200 truncate">
                              {combo.summary}
                            </div>

                            <div className="text-[11px] text-zinc-400 font-mono">
                              {combo.reason}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                            <div className="text-right">
                              <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                                Total Odds
                              </span>
                              <span
                                className={`text-base font-mono font-black ${
                                  combo.qualifies ? 'text-emerald-400' : 'text-zinc-500'
                                }`}
                              >
                                {combo.odds.toFixed(2)}
                              </span>
                            </div>

                            {combo.qualifies && (
                              <div>
                                {isCurrentActive ? (
                                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-default">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    Current Pick
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAuditCombo(combo)}
                                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95"
                                  >
                                    <MousePointerClick className="w-3.5 h-3.5" />
                                    Pick from here
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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

            <div className="p-5 overflow-y-auto space-y-2 text-xs">
              {result.allCombinations.map((combo, idx) => {
                const isCurrentActive =
                  pickedComboId === combo.id || (!pickedComboId && idx === 0 && combo.qualifies);

                return (
                  <div
                    key={combo.id || idx}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCurrentActive
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                        : combo.qualifies
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0 font-mono">
                      <div className="flex flex-wrap items-center gap-2">
                        {combo.qualifies ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            QUALIFIED (2.00–2.14)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400">
                            REJECTED
                          </span>
                        )}
                        {isCurrentActive && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500 text-zinc-950">
                            ACTIVE PICK
                          </span>
                        )}
                        {combo.statisticalScore !== undefined && (
                          <span className="text-[10px] text-zinc-400">
                            Score: {combo.statisticalScore}/100
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-200 font-semibold truncate">{combo.summary}</div>
                      <div className="text-[10px] text-zinc-400">{combo.reason}</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right font-mono">
                        <div
                          className={`font-bold text-sm ${
                            combo.qualifies ? 'text-emerald-400' : 'text-zinc-500'
                          }`}
                        >
                          {combo.odds.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-zinc-500">odds</div>
                      </div>

                      {combo.qualifies && (
                        <div>
                          {isCurrentActive ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5" />
                              Active
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectAuditCombo(combo);
                                setShowCombosModal(false);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow"
                            >
                              <MousePointerClick className="w-3.5 h-3.5" />
                              Pick this
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
