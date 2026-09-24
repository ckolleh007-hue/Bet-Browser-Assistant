import {
  ParsedBetRequest,
  BetRequestRecord,
  ActivityLogItem,
  BrowserActionState,
  SportsbookEvent,
  BetSlipState,
} from '../server/src/types/index.ts';

export async function parseInstructions(instructions: string): Promise<ParsedBetRequest> {
  const res = await fetch('/api/bets/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instructions }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to parse instructions');
  return data.parsed;
}

export async function startBetAgent(
  parsed: ParsedBetRequest,
  rawInstructions?: string
): Promise<{ betRequestId: string; record: BetRequestRecord }> {
  const res = await fetch('/api/bets/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parsed, rawInstructions }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start agent');
  return data;
}

export async function stopBetAgent(): Promise<{ message: string }> {
  const res = await fetch('/api/bets/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to stop agent');
  return data;
}

export async function getBetRequest(id: string): Promise<BetRequestRecord> {
  const res = await fetch(`/api/bets/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get bet');
  return data.record;
}

export async function getBetHistory(): Promise<BetRequestRecord[]> {
  const res = await fetch('/api/bets/history/all');
  const data = await res.json();
  if (!res.ok) return [];
  return data.list || [];
}

export async function getActivityLogs(betRequestId?: string): Promise<ActivityLogItem[]> {
  const url = betRequestId ? `/api/bets/${betRequestId}/activity` : `/api/bets/activity/all`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) return [];
  return data.logs || [];
}

export async function getBrowserStatus(): Promise<{
  status: BrowserActionState;
  isAgentRunning: boolean;
}> {
  const res = await fetch('/api/browser/status');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get browser status');
  return { status: data.status, isAgentRunning: data.isAgentRunning };
}

export async function startBrowser(): Promise<BrowserActionState> {
  const res = await fetch('/api/browser/start', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start browser');
  return data.status;
}

export async function stopBrowser(): Promise<BrowserActionState> {
  const res = await fetch('/api/browser/stop', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to stop browser');
  return data.status;
}

export async function getSportsbookEvents(query?: string): Promise<SportsbookEvent[]> {
  const url = query ? `/api/sportsbook/events?q=${encodeURIComponent(query)}` : '/api/sportsbook/events';
  const res = await fetch(url);
  const data = await res.json();
  return data.events || [];
}

export async function getBetSlip(): Promise<BetSlipState> {
  const res = await fetch('/api/sportsbook/bet-slip');
  const data = await res.json();
  return data.slip;
}

export async function confirmBetManually(): Promise<{ success: boolean; message: string; slip: BetSlipState }> {
  const res = await fetch('/api/sportsbook/confirm-bet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isHumanConfirmed: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Bet confirmation failed');
  return data;
}

export async function resetBetSlip(): Promise<BetSlipState> {
  const res = await fetch('/api/sportsbook/bet-slip/reset', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset bet slip');
  return data.slip;
}

export async function generateAiAutoPick(
  stake: number = 10,
  currency: string = 'USD'
): Promise<any> {
  const res = await fetch('/api/auto-pick/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stake, currency }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate AI auto pick');
  return data.data;
}

export async function executeAiAutoPick(payload: {
  selections: any[];
  stake: number;
  currency: string;
}): Promise<any> {
  const res = await fetch('/api/auto-pick/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to execute AI auto pick');
  return data;
}

export async function getLatestAutoPick(): Promise<any> {
  const res = await fetch('/api/auto-pick/latest');
  const data = await res.json();
  return data.data || null;
}
