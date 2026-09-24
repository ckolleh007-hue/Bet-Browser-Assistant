import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { DashboardHome } from './components/DashboardHome.tsx';
import { AiAutoPickView } from './components/AiAutoPickView.tsx';
import { NewBetView } from './components/NewBetView.tsx';
import { BetSlipView } from './components/BetSlipView.tsx';
import { BrowserView } from './components/BrowserView.tsx';
import { ActivityLogView } from './components/ActivityLogView.tsx';
import { MockSportsbookView } from './components/MockSportsbookView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import {
  getBrowserStatus,
  getBetSlip,
  getBetHistory,
  getActivityLogs,
  getBetRequest,
  stopBetAgent,
} from './api.ts';
import {
  BrowserActionState,
  BetSlipState,
  BetRequestRecord,
  ActivityLogItem,
  BrowserStatus,
  AgentStatus,
} from '../server/src/types/index.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [browserState, setBrowserState] = useState<BrowserActionState>({
    browserType: 'Chromium',
    mode: 'NiceBet Sportsbook (nicebet.com.lr)',
    connectionStatus: 'Disconnected',
    agentStatus: 'Stopped',
    currentUrl: 'about:blank',
    currentAction: 'Browser Ready',
    lastUpdated: '',
  });
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [slip, setSlip] = useState<BetSlipState>({
    items: [],
    stake: 10,
    currency: 'USD',
    totalOdds: 1,
    potentialReturn: 10,
    finalConfirmationReached: false,
    manualConfirmationRequired: false,
    betPlaced: false,
  });
  const [history, setHistory] = useState<BetRequestRecord[]>([]);
  const [activeBetId, setActiveBetId] = useState<string | null>(null);
  const [activeBetRequest, setActiveBetRequest] = useState<BetRequestRecord | null>(null);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);

  // Refresh all state
  const refreshAll = useCallback(async () => {
    try {
      const [bRes, slipRes, histRes, logRes] = await Promise.all([
        getBrowserStatus().catch(() => null),
        getBetSlip().catch(() => null),
        getBetHistory().catch(() => []),
        getActivityLogs().catch(() => []),
      ]);

      if (bRes) {
        setBrowserState(bRes.status);
        setIsAgentRunning(bRes.isAgentRunning);
      }
      if (slipRes) {
        setSlip(slipRes);
      }
      if (histRes) {
        setHistory(histRes);
      }
      if (logRes) {
        setLogs(logRes);
      }

      if (activeBetId) {
        const bet = await getBetRequest(activeBetId).catch(() => null);
        if (bet) setActiveBetRequest(bet);
      } else if (histRes && histRes.length > 0) {
        setActiveBetRequest(histRes[0]);
      }
    } catch (e) {
      console.error('Error refreshing state:', e);
    }
  }, [activeBetId]);

  // Polling loop
  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 1500);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const handleEmergencyStop = async () => {
    try {
      await stopBetAgent();
      await refreshAll();
    } catch (e) {
      console.error('Error stopping agent:', e);
    }
  };

  const handleAgentStarted = (betRequestId: string) => {
    setActiveBetId(betRequestId);
    setCurrentTab('bet-slip');
    refreshAll();
  };

  // Determine aggregate browser/agent status for header
  const getHeaderBrowserStatus = (): BrowserStatus => {
    if (isAgentRunning) return 'Agent Running';
    if (slip.manualConfirmationRequired || browserState.agentStatus === 'Waiting for Review') {
      return 'Waiting for Review';
    }
    if (browserState.agentStatus === 'Stopped') return 'Stopped';
    if (browserState.connectionStatus === 'Connected') return 'Browser Ready';
    return 'Browser Offline';
  };

  const currentAgentStatus: AgentStatus = isAgentRunning
    ? 'RUNNING'
    : slip.manualConfirmationRequired
    ? 'WAITING FOR REVIEW'
    : activeBetRequest?.status || 'READY';

  const pendingReviewCount = slip.manualConfirmationRequired && !slip.betPlaced ? 1 : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Header */}
      <Header
        browserStatus={getHeaderBrowserStatus()}
        isAgentRunning={isAgentRunning}
        onEmergencyStop={handleEmergencyStop}
        onOpenSportsbook={() => setCurrentTab('sportsbook')}
      />

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingReviewCount={pendingReviewCount}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-61px)]">
          {currentTab === 'dashboard' && (
            <DashboardHome
              agentStatus={currentAgentStatus}
              browserState={browserState}
              slip={slip}
              history={history}
              onNavigate={setCurrentTab}
              onEmergencyStop={handleEmergencyStop}
            />
          )}

          {currentTab === 'auto-pick' && (
            <AiAutoPickView
              onAgentStarted={handleAgentStarted}
              onNavigateToBetSlip={() => setCurrentTab('bet-slip')}
            />
          )}

          {currentTab === 'new-bet' && (
            <NewBetView onAgentStarted={handleAgentStarted} />
          )}

          {currentTab === 'bet-slip' && (
            <BetSlipView
              slip={slip}
              activeBetRequest={activeBetRequest}
              onEmergencyStop={handleEmergencyStop}
              onRefreshSlip={refreshAll}
            />
          )}

          {currentTab === 'browser' && (
            <BrowserView
              browserState={browserState}
              isAgentRunning={isAgentRunning}
              slip={slip}
              onRefresh={refreshAll}
              onStartAgentTab={() => setCurrentTab('new-bet')}
            />
          )}

          {currentTab === 'activity-log' && (
            <ActivityLogView logs={logs} onRefresh={refreshAll} />
          )}

          {currentTab === 'sportsbook' && (
            <MockSportsbookView onSlipUpdated={refreshAll} slip={slip} />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
