import React, { useState } from 'react';
import { ActivityLogItem } from '../../server/src/types/index.ts';
import { ScrollText, Filter, CheckCircle2, AlertTriangle, XCircle, Info, RefreshCw } from 'lucide-react';

interface ActivityLogViewProps {
  logs: ActivityLogItem[];
  onRefresh: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs, onRefresh }) => {
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'success'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const getLevelBadge = (level: ActivityLogItem['level']) => {
    switch (level) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        );
      case 'warn':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            WARN
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
            <XCircle className="w-3 h-3" />
            ERROR
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Real-Time Activity Log</h2>
              <p className="text-xs text-zinc-400">
                Timestamped browser navigation & verification event stream
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({logs.length})
              </button>
              <button
                onClick={() => setFilter('success')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === 'success' ? 'bg-zinc-800 text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setFilter('warn')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === 'warn' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Safety & Warnings
              </button>
              <button
                onClick={() => setFilter('error')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === 'error' ? 'bg-zinc-800 text-red-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Errors
              </button>
            </div>

            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Refresh log feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Terminal Log Viewer */}
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-4 font-mono text-xs max-h-[600px] overflow-y-auto space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-zinc-600">
              No activity logs recorded yet. Start a new bet to generate live execution logs.
            </div>
          ) : (
            filteredLogs.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 py-2 px-2.5 rounded hover:bg-zinc-900/60 transition border-l-2 border-transparent hover:border-emerald-500"
              >
                <div className="text-zinc-500 select-none text-[11px] shrink-0 font-semibold">
                  {item.timestamp}
                </div>
                <div className="shrink-0">{getLevelBadge(item.level)}</div>
                <div
                  className={`flex-1 break-words ${
                    item.level === 'error'
                      ? 'text-red-400 font-semibold'
                      : item.level === 'warn'
                      ? 'text-amber-300 font-medium'
                      : item.level === 'success'
                      ? 'text-emerald-300'
                      : 'text-zinc-300'
                  }`}
                >
                  {item.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
