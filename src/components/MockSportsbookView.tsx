import React, { useState, useEffect } from 'react';
import { SportsbookEvent, BetSlipState } from '../../server/src/types/index.ts';
import { getSportsbookEvents, confirmBetManually } from '../api.ts';
import {
  Search,
  Trophy,
  Plus,
  Check,
  Receipt,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  RefreshCw,
  Flame,
} from 'lucide-react';

interface MockSportsbookViewProps {
  onSlipUpdated: () => void;
  slip: BetSlipState;
}

export const MockSportsbookView: React.FC<MockSportsbookViewProps> = ({
  onSlipUpdated,
  slip,
}) => {
  const [events, setEvents] = useState<SportsbookEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [barrierAlert, setBarrierAlert] = useState<string | null>(null);
  const [isHumanConfirmed, setIsHumanConfirmed] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);

  const fetchEvents = async (q?: string) => {
    try {
      const ev = await getSportsbookEvents(q);
      setEvents(ev);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/sportsbook/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      } else {
        await fetchEvents(searchQuery);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents(searchQuery);
  }, [searchQuery]);

  const sportsList = ['All', ...Array.from(new Set(events.map((e) => e.sport).filter(Boolean)))];

  const filteredEvents = events.filter((e) => {
    if (selectedSport !== 'All' && e.sport !== selectedSport) return false;
    return true;
  });

  const handleToggleSelection = async (
    eventId: string,
    marketName: string,
    outcomeName: string
  ) => {
    try {
      const res = await fetch('/api/sportsbook/bet-slip/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, marketName, selection: outcomeName }),
      });
      if (res.ok) {
        onSlipUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateAgentClickPlaceBet = () => {
    // Demonstrates what happens if automation or an external script calls the place-bet action
    setBarrierAlert(
      '[CRITICAL SAFETY BARRIER ENFORCED]: Automation is strictly barred from clicking "PLACE BET" on NiceBet. Control is returned to the user.'
    );
  };

  const handleHumanPlaceBet = async () => {
    if (!isHumanConfirmed) {
      setConfirmStatus('Please check the manual human confirmation box first.');
      return;
    }
    try {
      const res = await confirmBetManually();
      setConfirmStatus(res.message);
      onSlipUpdated();
    } catch (err: any) {
      setConfirmStatus(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Sportsbook Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>NiceBet Liberia Live Sportsbook Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              NiceBet Sportsbook (nicebet.com.lr)
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-0.5">
              Live odds and match feed connected directly to NiceBet Liberia via Altenar platform.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Live Odds</span>
            </button>

            <a
              href="https://www.nicebet.com.lr/en/sports"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition"
            >
              <span>Visit nicebet.com.lr</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Safety Barrier Alert Banner if triggered */}
      {barrierAlert && (
        <div className="p-4 rounded-xl bg-red-500/15 border-2 border-red-500/60 text-xs text-red-200 flex items-start gap-3 shadow-lg">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold uppercase tracking-wider text-red-300">
              Safety Barrier Triggered
            </div>
            <div>{barrierAlert}</div>
          </div>
        </div>
      )}

      {/* Search and Sport Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search live NiceBet events, teams (e.g. Portugal, Wales, Norway...)"
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {sportsList.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {sportsList.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  selectedSport === sport
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Events List (8 cols) + Bet Slip Preview & Barrier Demonstration (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Events Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-zinc-500 px-1">
            <span>Live Events ({filteredEvents.length})</span>
            <span>Altenar Live Feed</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-500 text-xs">
              No events found matching "{searchQuery}". Try refreshing live events.
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition space-y-4"
              >
                {/* Event Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                        {event.sport}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">
                        {event.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {event.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {event.startTime}
                  </span>
                </div>

                {/* Markets Grid */}
                <div className="space-y-3">
                  {event.markets.slice(0, 3).map((market) => (
                    <div key={market.id} className="space-y-1.5">
                      <div className="text-[11px] font-mono uppercase text-zinc-400">
                        {market.name}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {market.outcomes.map((outcome) => {
                          const isSelected = slip.items.some(
                            (item) =>
                              item.eventId === event.id &&
                              item.marketId === market.id &&
                              item.outcomeId === outcome.id
                          );

                          return (
                            <button
                              key={outcome.id}
                              onClick={() =>
                                handleToggleSelection(event.id, market.name, outcome.name)
                              }
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/10'
                                  : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                              }`}
                            >
                              <span className="truncate mr-2">{outcome.name}</span>
                              <span
                                className={`font-mono font-bold ${
                                  isSelected ? 'text-emerald-400' : 'text-zinc-400'
                                }`}
                              >
                                {outcome.odds.toFixed(2)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bet Slip & Final Transaction Safety Barrier Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-5 sticky top-20">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">NiceBet Slip</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {slip.items.length} items
              </span>
            </div>

            {/* Slip Items */}
            {slip.items.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                NiceBet slip is empty. Click odds or run the AI agent to populate.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {slip.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs space-y-1"
                  >
                    <div className="flex justify-between font-bold text-white">
                      <span className="truncate">{item.selection}</span>
                      <span className="font-mono text-emerald-400">{item.odds.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">{item.eventTitle}</div>
                    <div className="text-[10px] font-mono text-zinc-500">{item.marketName}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Stake:</span>
                <span className="text-white font-bold">
                  {slip.currency} {slip.stake.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Odds:</span>
                <span className="text-emerald-400 font-bold">{slip.totalOdds.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Est. Return:</span>
                <span className="text-emerald-400 font-bold">
                  {slip.currency} {slip.potentialReturn.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Safety Barrier Enforcement Section */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Transaction Safety Barrier</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                The Playwright agent is strictly prohibited from clicking "PLACE BET". Any automated attempt is halted.
              </p>

              {/* Automated click simulation test button */}
              <button
                onClick={handleSimulateAgentClickPlaceBet}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
              >
                Test Safety Barrier Rejection
              </button>
            </div>

            {/* Final Manual Human Confirmation */}
            {slip.finalConfirmationReached && !slip.betPlaced && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                  <span>Manual Confirmation Screen</span>
                </div>

                <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHumanConfirmed}
                    onChange={(e) => setIsHumanConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>
                    I have manually reviewed all selections on NiceBet and explicitly confirm.
                  </span>
                </label>

                <button
                  onClick={handleHumanPlaceBet}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition shadow-lg shadow-emerald-500/20"
                >
                  MANUALLY CONFIRM & PLACE BET
                </button>
              </div>
            )}

            {slip.betPlaced && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-center text-xs font-mono text-emerald-400 font-bold">
                ✓ Bet manually confirmed and recorded.
              </div>
            )}

            {confirmStatus && (
              <div className="text-[11px] font-mono text-zinc-400 text-center">
                {confirmStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
