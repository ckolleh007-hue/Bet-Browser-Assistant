export type AgentStatus =
  | 'READY'
  | 'RUNNING'
  | 'VERIFYING'
  | 'WAITING FOR REVIEW'
  | 'STOPPED'
  | 'ERROR';

export type BrowserStatus =
  | 'Browser Offline'
  | 'Browser Ready'
  | 'Agent Running'
  | 'Waiting for Review'
  | 'Stopped';

export interface BetInstruction {
  event: string;
  market: string;
  selection: string;
  odds?: number;
}

export interface ParsedBetRequest {
  stake: number;
  currency: string;
  bets: BetInstruction[];
}

export interface BetSelectionRecord {
  id: string;
  bet_request_id: string;
  event: string;
  market: string;
  selection: string;
  requested_odds?: number;
  actual_odds?: number;
  status: 'PENDING' | 'FOUND' | 'ADDED' | 'MISMATCH' | 'FAILED';
  mismatch_reason?: string;
}

export interface BetRequestRecord {
  id: string;
  user_id?: string;
  raw_instructions: string;
  stake: number;
  currency: string;
  status: AgentStatus;
  status_message?: string;
  created_at: string;
  updated_at: string;
  selections: BetSelectionRecord[];
  total_odds?: number;
  potential_return?: number;
}

export interface ActivityLogItem {
  id: string;
  bet_request_id?: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface SportsbookMarketOutcome {
  id: string;
  name: string;
  odds: number;
}

export interface SportsbookMarket {
  id: string;
  name: string; // e.g. "Match Result", "Over/Under 2.5"
  outcomes: SportsbookMarketOutcome[];
}

export interface MatchStatisticalData {
  recentForm: {
    home: string; // e.g. "W-W-D-W-L"
    away: string; // e.g. "W-D-L-W-D"
    homeAvgGoalsScored: number;
    homeAvgGoalsConceded: number;
    awayAvgGoalsScored: number;
    awayAvgGoalsConceded: number;
    homeLast5Results: string[];
    awayLast5Results: string[];
  };
  headToHead: {
    meetingsCount: number;
    avgTotalGoals: number;
    over25Percentage: number;
    under55Percentage: number;
    bttsPercentage: number;
    recentScores: string[];
    notes: string;
  };
  matchStats: {
    expectedGoalsCombined: number;
    shotsPerMatchCombined: number;
    possessionHome: number;
    cornersAvgCombined: number;
    cleanSheetRateCombined: number;
    bothTeamsToScoreTrend: string;
    overUnder5Trend: string;
  };
  teamInfo: {
    injuriesAndSuspensions: string;
    lineupStatus: 'Confirmed' | 'Expected';
    keyPlayersAvailable: boolean;
  };
  competition: {
    league: string;
    importance: string;
    homeAdvantageIndex: number;
  };
}

export interface SportsbookEvent {
  id: string;
  title: string; // e.g. "Manchester City vs Arsenal"
  homeTeam: string;
  awayTeam: string;
  sport: string;
  category: string;
  startTime: string;
  markets: SportsbookMarket[];
  stats?: MatchStatisticalData;
}

export interface AiAutoPickCandidate {
  eventId: string;
  teams: string;
  homeTeam: string;
  awayTeam: string;
  market: 'Multigoals' | 'Multigoals 1 & Multigoals 2';
  selection: '0-5' | '(1-4),(0-2)';
  odds: number;
  analysis: string;
  confidence: number; // 0 to 1
  dataQuality: 'EXCELLENT' | 'HIGH' | 'GOOD';
  stats?: MatchStatisticalData;
}

export interface CandidateCombination {
  id: string;
  selections: AiAutoPickCandidate[];
  combinedOdds: number;
  qualifies: boolean;
  rejectReason?: string;
  averageConfidence: number;
  statisticalScore: number;
}

export interface AiAutoPickResponse {
  mode: 'AI_AUTO_PICK';
  targetOdds: {
    min: number;
    max: number;
  };
  stake: number;
  currency: string;
  selections: Array<{
    eventId: string;
    teams: string;
    market: string;
    selection: string;
    odds: number;
    analysis: string;
    confidence: number;
    statsSummary?: string;
  }>;
  combinedOdds: number;
  status: 'QUALIFIED' | 'NO_QUALIFYING_SELECTION';
  reason?: string;
  summary: string;
  totalCandidatesEvaluated: number;
  totalCombinationsGenerated: number;
  qualifyingCombinationsCount: number;
  allCombinations: Array<{
    summary: string;
    odds: number;
    qualifies: boolean;
    reason: string;
  }>;
  auditTrail: string[];
}

export interface BetSlipItem {
  eventId: string;
  eventTitle: string;
  marketId: string;
  marketName: string;
  outcomeId: string;
  selection: string;
  odds: number;
}

export interface BetSlipState {
  items: BetSlipItem[];
  stake: number;
  currency: string;
  totalOdds: number;
  potentialReturn: number;
  finalConfirmationReached: boolean;
  manualConfirmationRequired: boolean;
  betPlaced: boolean; // Only user can set this, NEVER the agent
}

export interface VerificationCheck {
  field: 'Event' | 'Teams' | 'Market' | 'Selection' | 'Odds' | 'Stake' | 'Number of selections' | 'Combined odds';
  expected: string | number;
  actual: string | number;
  passed: boolean;
  message: string;
}

export interface VerificationResult {
  verified: boolean;
  status: 'MATCH' | 'SELECTION MISMATCH';
  checks: VerificationCheck[];
  errors: string[];
}

export interface BrowserActionState {
  browserType: 'Chromium';
  mode: 'NiceBet Sportsbook (nicebet.com.lr)' | 'Mock Sportsbook';
  connectionStatus: 'Connected' | 'Disconnected' | 'Connecting';
  agentStatus: 'Running' | 'Stopped' | 'Waiting for Review' | 'Error';
  currentUrl: string;
  currentAction: string;
  lastUpdated: string;
  screenshotBase64?: string;
  activeHtmlPreview?: string;
}

