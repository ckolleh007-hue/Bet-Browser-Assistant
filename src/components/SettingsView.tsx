import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Globe,
  ExternalLink,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResetSlip = async () => {
    setResetting(true);
    try {
      await fetch('/api/sportsbook/bet-slip/reset', { method: 'POST' });
      setMessage('NiceBet slip reset successfully.');
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">System & Sportsbook Settings</h2>
            <p className="text-xs text-zinc-400">
              NiceBet platform integration, safety barrier status, database models, and DeepSeek AI configuration
            </p>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-mono">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NiceBet Liberia Section */}
          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>NiceBet Liberia Platform</span>
              </div>
              <a
                href="https://www.nicebet.com.lr/en/sports"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <span>nicebet.com.lr</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Connected to NiceBet Liberia via the Altenar sportsbook widget API.
            </p>

            <div className="space-y-2 pt-2 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Target Website:</span>
                <span className="text-emerald-400">https://www.nicebet.com.lr/</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Engine / Provider:</span>
                <span className="text-white">Altenar Sportsbook (WSDK)</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Supported Currencies:</span>
                <span className="text-zinc-300">LRD (Liberian Dollar) & USD ($)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Integration ID:</span>
                <span className="text-zinc-400">nicebet.liberia</span>
              </div>
            </div>
          </div>

          {/* Safety Barrier Section */}
          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Safety Barrier Enforcement</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero-tolerance controls preventing automated real-money transactions on NiceBet.
            </p>

            <div className="space-y-2 pt-2 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Automated Place Bet Clicks:</span>
                <span className="text-red-400 font-bold">HARD-BLOCKED / FORBIDDEN</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Verification Engine:</span>
                <span className="text-emerald-400">7-Field Discrepancy Halt</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Transaction Status:</span>
                <span className="text-amber-400">STOPS BEFORE SUBMISSION</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Manual Confirmation:</span>
                <span className="text-emerald-400">Strictly Required</span>
              </div>
            </div>
          </div>

          {/* Database Section */}
          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>PostgreSQL Database</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Database models configured for audit logging, request history, and verification.
            </p>

            <div className="space-y-2 pt-2 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Connection Mode:</span>
                <span className="text-emerald-400">Active (Auto-Provisioned / Fallback)</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Database Engine:</span>
                <span className="text-white">PostgreSQL (pg pool driver)</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Tables Initialized:</span>
                <span className="text-zinc-300">users, bet_requests, bet_selections, activity_logs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sportsbook Credentials:</span>
                <span className="text-emerald-400">None Stored (Security Compliant)</span>
              </div>
            </div>
          </div>

          {/* DeepSeek AI & Browser Core */}
          <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>DeepSeek AI & Playwright Core</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              DeepSeek natural language parsing paired with Playwright Chromium driver.
            </p>

            <div className="space-y-2 pt-2 text-xs font-mono">
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Model:</span>
                <span className="text-purple-300 font-bold">deepseek-chat</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Browser Driver:</span>
                <span className="text-cyan-300">Playwright Chromium</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Output Validation:</span>
                <span className="text-zinc-300">Strict JSON Schema with Heuristic Fallback</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Target URL:</span>
                <span className="text-emerald-400 truncate">https://www.nicebet.com.lr/en/sports</span>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Tools */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Reset test state or clear current NiceBet slip selections.
          </div>
          <button
            onClick={handleResetSlip}
            disabled={resetting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Bet Slip State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
