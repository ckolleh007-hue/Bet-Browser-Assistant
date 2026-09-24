import React, { useState, useEffect } from 'react';
import { ParsedBetRequest, SportsbookEvent } from '../../server/src/types/index.ts';
import { parseInstructions, startBetAgent, getSportsbookEvents } from '../api.ts';
import { Sparkles, Play, Trash2, Plus, Edit3, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface NewBetViewProps {
  onAgentStarted: (betRequestId: string) => void;
}

const DEFAULT_INSTRUCTIONS = `Prepare a $10 bet:

Portugal vs Wales
Market: Multigoals
Selection: 0-5

Norway vs Denmark
Market: Multigoals 1 & Multigoals 2
Selection: (1-4),(0-2)`;

const PRESET_SINGLE = `Prepare a $10 bet:
Portugal vs Wales
Market: Multigoals
Selection: 0-5`;

const PRESET_LRD_MULTI = `Prepare a 500 LRD bet:
Portugal vs Wales
Market: Multigoals
Selection: 0-5

Norway vs Denmark
Market: Multigoals 1 & Multigoals 2
Selection: (1-4),(0-2)`;

export const NewBetView: React.FC<NewBetViewProps> = ({ onAgentStarted }) => {
  const [rawText, setRawText] = useState(DEFAULT_INSTRUCTIONS);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedBetRequest | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [jsonEditMode, setJsonEditMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [liveEvents, setLiveEvents] = useState<SportsbookEvent[]>([]);

  useEffect(() => {
    getSportsbookEvents()
      .then((ev) => setLiveEvents(ev))
      .catch(() => {});
  }, []);

  const handleParse = async () => {
    setIsParsing(true);
    setParseError(null);
    try {
      const result = await parseInstructions(rawText);
      setParsed(result);
      setJsonText(JSON.stringify(result, null, 2));
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse instructions');
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartAgent = async () => {
    if (!parsed) return;
    setIsLaunching(true);
    try {
      const res = await startBetAgent(parsed, rawText);
      onAgentStarted(res.betRequestId);
    } catch (err: any) {
      setParseError(err.message || 'Failed to start browser agent');
      setIsLaunching(false);
    }
  };

  const handleUpdateSelection = (index: number, field: string, value: string) => {
    if (!parsed) return;
    const newBets = [...parsed.bets];
    newBets[index] = { ...newBets[index], [field]: value };
    const updated = { ...parsed, bets: newBets };
    setParsed(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleRemoveSelection = (index: number) => {
    if (!parsed) return;
    const newBets = parsed.bets.filter((_, i) => i !== index);
    const updated = { ...parsed, bets: newBets };
    setParsed(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleAddSelection = () => {
    if (!parsed) return;
    const sampleEvent = liveEvents[0]?.title || 'Portugal vs Wales';
    const newBets = [
      ...parsed.bets,
      { event: sampleEvent, market: 'Multigoals', selection: '0-5' },
    ];
    const updated = { ...parsed, bets: newBets };
    setParsed(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const handleLoadLiveMatchPreset = (event: SportsbookEvent) => {
    const market = event.markets[0]?.name || 'Multigoals';
    const selection = event.markets[0]?.outcomes[0]?.name || '0-5';
    const text = `Prepare a $10 bet:\n\n${event.title}\nMarket: ${market}\nSelection: ${selection}`;
    setRawText(text);
  };

  const handleJsonApply = () => {
    try {
      const obj = JSON.parse(jsonText) as ParsedBetRequest;
      setParsed(obj);
      setJsonEditMode(false);
      setParseError(null);
    } catch (e: any) {
      setParseError(`Invalid JSON format: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>NiceBet Liberia AI Agent (nicebet.com.lr)</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              Prepare New Bet
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
              Enter your betting instructions in natural language. DeepSeek AI will parse them into structured selections for NiceBet.
            </p>
          </div>

          <a
            href="https://www.nicebet.com.lr/en/sports"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
          >
            <span>Open nicebet.com.lr</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Preset Pickers */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono uppercase text-zinc-500 mr-2">Default Betting Options:</span>
        <button
          onClick={() => setRawText(DEFAULT_INSTRUCTIONS)}
          className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs border border-emerald-700/50 transition font-medium"
        >
          Default (Multigoals 0-5 + Multigoals 1 & Multigoals 2 (1-4),(0-2))
        </button>
        <button
          onClick={() => setRawText(PRESET_SINGLE)}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800 transition"
        >
          Option 1: Multigoals (0-5)
        </button>
        <button
          onClick={() => setRawText(PRESET_LRD_MULTI)}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-cyan-300 text-xs border border-zinc-800 transition"
        >
          Liberian Dollar (500 LRD Multi-Goals)
        </button>

        {liveEvents.slice(0, 2).map((ev) => (
          <button
            key={ev.id}
            onClick={() => handleLoadLiveMatchPreset(ev)}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs border border-cyan-800/40 transition flex items-center gap-1"
          >
            <span>Live: {ev.homeTeam}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase text-zinc-400 mb-2 font-semibold">
            Natural Language Betting Instructions
          </label>
          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Type instructions e.g. Prepare a $10 bet: Portugal vs Wales, Market: Multigoals, Selection: 0-5..."
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/80 leading-relaxed"
          />
        </div>

        {parseError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1">
              <div className="font-bold">Error Processing Instructions</div>
              <div>{parseError}</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="text-[11px] text-zinc-500">
            Powered by DeepSeek AI (deepseek-chat) structured schema validation with fallback.
          </div>

          <button
            onClick={handleParse}
            disabled={isParsing || !rawText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 cursor-pointer active:scale-95"
          >
            {isParsing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Parsing with DeepSeek AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Parse Instructions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Parsed Instructions Panel */}
      {parsed && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold">Structured Betting Selections</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setJsonEditMode(!jsonEditMode)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{jsonEditMode ? 'Form View' : 'Raw JSON View'}</span>
              </button>
            </div>
          </div>

          {jsonEditMode ? (
            <div className="space-y-3">
              <textarea
                rows={12}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full p-4 bg-zinc-950 font-mono text-xs text-emerald-400 border border-zinc-800 rounded-xl focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleJsonApply}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition"
              >
                Apply JSON Changes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stake & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                    Stake Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={parsed.stake}
                      onChange={(e) => {
                        const val = Math.max(1, parseFloat(e.target.value) || 1);
                        const updated = { ...parsed, stake: val };
                        setParsed(updated);
                        setJsonText(JSON.stringify(updated, null, 2));
                      }}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={parsed.currency}
                    onChange={(e) => {
                      const updated = { ...parsed, currency: e.target.value };
                      setParsed(updated);
                      setJsonText(JSON.stringify(updated, null, 2));
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="LRD">LRD (Liberian Dollar)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Selections List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-zinc-400">
                    Selections ({parsed.bets.length})
                  </span>
                  <button
                    onClick={handleAddSelection}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Selection</span>
                  </button>
                </div>

                {parsed.bets.map((bet, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800 items-center"
                  >
                    <div className="md:col-span-1 text-xs font-mono text-zinc-500">#{idx + 1}</div>

                    <div className="md:col-span-4">
                      <label className="block text-[10px] uppercase font-mono text-zinc-500">
                        Event
                      </label>
                      <input
                        type="text"
                        value={bet.event}
                        onChange={(e) => handleUpdateSelection(idx, 'event', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] uppercase font-mono text-zinc-500">
                        Market
                      </label>
                      <input
                        type="text"
                        value={bet.market}
                        onChange={(e) => handleUpdateSelection(idx, 'market', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] uppercase font-mono text-zinc-500">
                        Selection
                      </label>
                      <input
                        type="text"
                        value={bet.selection}
                        onChange={(e) => handleUpdateSelection(idx, 'selection', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                      />
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => handleRemoveSelection(idx)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                        title="Remove selection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Start Agent CTA */}
              <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-zinc-400">
                  Ready to launch Playwright browser against NiceBet Liberia (nicebet.com.lr).
                </div>

                <button
                  onClick={handleStartAgent}
                  disabled={isLaunching || parsed.bets.length === 0}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 cursor-pointer active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Browser Agent</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
