import { browserController, NICEBET_URL } from '../browser/browserController.ts';
import { mockSportsbook } from '../services/mockSportsbook.ts';
import { verificationEngine } from '../services/verificationEngine.ts';
import { db } from '../database/index.ts';
import { ParsedBetRequest, BetRequestRecord, VerificationResult } from '../types/index.ts';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class BetAgentRunner {
  private activeRunId: string | null = null;
  private isRunning = false;

  public async run(betRequest: BetRequestRecord, parsed: ParsedBetRequest): Promise<{
    success: boolean;
    verification?: VerificationResult;
    error?: string;
  }> {
    if (this.isRunning) {
      throw new Error('An agent session is already running. Please stop or wait for it to complete.');
    }

    this.isRunning = true;
    this.activeRunId = betRequest.id;
    browserController.resetEmergencyStop();
    browserController.setActiveBetRequestId(betRequest.id);

    const log = async (msg: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
      await db.addActivityLog(betRequest.id, msg, level);
      browserController.setCurrentAction(msg);
    };

    try {
      // Step 1: Start browser
      browserController.setAgentStatus('Running', 'Starting browser for NiceBet');
      await db.updateBetRequestStatus(betRequest.id, 'RUNNING', 'Browser started');
      await log('Browser started for NiceBet (nicebet.com.lr)', 'info');
      await sleep(600);
      this.checkStop();

      await browserController.startBrowser();

      // Step 2: Open NiceBet sportsbook
      await log('Connecting to NiceBet Sportsbook (nicebet.com.lr)', 'info');
      await browserController.navigate(NICEBET_URL);
      mockSportsbook.resetBetSlip();
      await sleep(700);
      this.checkStop();

      await log('Processing betting instructions', 'info');
      await sleep(500);
      this.checkStop();

      // Validate Stake
      if (!parsed.stake || parsed.stake <= 0) {
        throw new Error(`Invalid stake amount: ${parsed.stake}. Stake must be greater than zero.`);
      }
      if (parsed.bets.length === 0) {
        throw new Error('No betting selections provided in instruction.');
      }

      // Check for duplicate selections in request
      const seenKeys = new Set<string>();
      for (const b of parsed.bets) {
        const key = `${b.event.toLowerCase()}::${b.market.toLowerCase()}::${b.selection.toLowerCase()}`;
        if (seenKeys.has(key)) {
          throw new Error(`Duplicate selection detected: "${b.selection}" in "${b.event}". Duplicate selections are not permitted.`);
        }
        seenKeys.add(key);
      }

      // Steps 3-7: Search for event, market, selection, add to slip
      for (let i = 0; i < parsed.bets.length; i++) {
        this.checkStop();
        const bet = parsed.bets[i];
        const selectionRecord = betRequest.selections[i];

        // Step 3: Search for requested event on NiceBet
        await log(`Searching NiceBet for ${bet.event}`, 'info');
        await sleep(700);
        this.checkStop();

        const event = mockSportsbook.findEventByTeams(bet.event);
        if (!event) {
          const err = `Event not found on NiceBet: "${bet.event}". Automation stopped without substitution.`;
          if (selectionRecord) {
            await db.updateSelectionStatus(selectionRecord.id, 'FAILED', undefined, err);
          }
          throw new Error(err);
        }

        await log(`Event found on NiceBet: ${event.title}`, 'success');
        await sleep(400);
        this.checkStop();

        // Load full markets if needed from NiceBet
        await mockSportsbook.loadFullEventMarkets(event.id);

        // Step 4: Find requested market on NiceBet
        await log(`Searching NiceBet market "${bet.market}"`, 'info');
        const market = mockSportsbook.findMarket(event, bet.market);
        if (!market) {
          const err = `Market "${bet.market}" not found on NiceBet for event "${event.title}". Automation stopped.`;
          if (selectionRecord) {
            await db.updateSelectionStatus(selectionRecord.id, 'FAILED', undefined, err);
          }
          throw new Error(err);
        }

        await log(`NiceBet market "${market.name}" found`, 'success');
        await sleep(400);
        this.checkStop();

        // Step 5: Find requested selection on NiceBet
        await log(`Searching NiceBet selection "${bet.selection}"`, 'info');
        const outcome = mockSportsbook.findOutcome(event, market, bet.selection);
        if (!outcome) {
          const err = `Selection "${bet.selection}" not found in market "${market.name}" for "${event.title}" on NiceBet. Automation stopped.`;
          if (selectionRecord) {
            await db.updateSelectionStatus(selectionRecord.id, 'FAILED', undefined, err);
          }
          throw new Error(err);
        }

        // Step 6: Add selection to NiceBet bet slip
        const addResult = mockSportsbook.addSelection(event.id, market.name, outcome.name);
        if (!addResult.success) {
          throw new Error(addResult.error || 'Failed to add selection to NiceBet bet slip');
        }

        if (selectionRecord) {
          await db.updateSelectionStatus(selectionRecord.id, 'ADDED', outcome.odds);
        }

        await log(`${outcome.name} selected on NiceBet (Odds: ${outcome.odds.toFixed(2)})`, 'success');
        await sleep(600);
        this.checkStop();
      }

      // Step 8: Open bet slip
      await log('Opening NiceBet bet slip', 'info');
      await sleep(600);
      this.checkStop();

      // Step 10: Enter/display requested stake
      const currency = parsed.currency || 'USD';
      await log(`Setting stake to ${currency} ${parsed.stake.toFixed(2)}`, 'info');
      const updatedSlip = mockSportsbook.setStake(parsed.stake, currency);
      await sleep(500);
      this.checkStop();

      // Step 9: Verify the selections
      browserController.setAgentStatus('Running', 'Verifying selections...');
      await db.updateBetRequestStatus(betRequest.id, 'VERIFYING', 'Verifying bet slip selections against instructions');
      await log('Verifying NiceBet bet slip against requested instructions', 'info');
      await sleep(700);
      this.checkStop();

      const verification = verificationEngine.verify(parsed, updatedSlip);

      if (!verification.verified) {
        const errorDetail = verification.errors.join('; ');
        await log(`SELECTION MISMATCH: ${errorDetail}`, 'error');
        await db.updateBetRequestStatus(
          betRequest.id,
          'ERROR',
          `SELECTION MISMATCH: ${errorDetail}`,
          updatedSlip.totalOdds,
          updatedSlip.potentialReturn
        );
        browserController.setAgentStatus('Error', `SELECTION MISMATCH: ${errorDetail}`);
        return {
          success: false,
          verification,
          error: `SELECTION MISMATCH: ${errorDetail}`,
        };
      }

      await log('✓ MATCH - NiceBet bet slip fully verified', 'success');
      await sleep(500);
      this.checkStop();

      // Step 11: Navigate to the final confirmation screen
      mockSportsbook.reachFinalConfirmation();
      await log('Final confirmation reached on NiceBet', 'info');
      await sleep(400);

      // Step 12: STOP!
      // CRITICAL MANDATORY SAFETY BARRIER:
      // The automation MUST NEVER click "PLACE BET" or submit payment on NiceBet.
      // Control is returned strictly to the human user.
      await log('Automation stopped before transaction', 'warn');
      await log('Waiting for manual confirmation by user on NiceBet', 'warn');

      browserController.setAgentStatus('Waiting for Review', 'Waiting for manual confirmation on NiceBet');
      await db.updateBetRequestStatus(
        betRequest.id,
        'WAITING FOR REVIEW',
        'WAITING FOR MANUAL CONFIRMATION: The automation has stopped. Please review selections and confirm manually on NiceBet (nicebet.com.lr).',
        updatedSlip.totalOdds,
        updatedSlip.potentialReturn
      );

      return {
        success: true,
        verification,
      };
    } catch (err: any) {
      const isStopped = err.message?.includes('AGENT_EMERGENCY_STOPPED') || browserController.isStopped();
      const status = isStopped ? 'STOPPED' : 'ERROR';
      const msg = isStopped ? 'Agent stopped by user.' : err.message || 'Unknown agent error';

      await log(msg, isStopped ? 'warn' : 'error');
      browserController.setAgentStatus(isStopped ? 'Stopped' : 'Error', msg);
      await db.updateBetRequestStatus(betRequest.id, status, msg);

      return {
        success: false,
        error: msg,
      };
    } finally {
      this.isRunning = false;
      this.activeRunId = null;
    }
  }

  public emergencyStop(): void {
    browserController.emergencyStop('Agent stopped by user.');
    this.isRunning = false;
    if (this.activeRunId) {
      db.updateBetRequestStatus(this.activeRunId, 'STOPPED', 'Agent stopped by user.').catch(() => {});
      db.addActivityLog(this.activeRunId, 'Agent stopped by user.', 'warn').catch(() => {});
    }
  }

  private checkStop(): void {
    if (browserController.isStopped()) {
      throw new Error('AGENT_EMERGENCY_STOPPED: Execution cancelled by user.');
    }
  }

  public isAgentRunning(): boolean {
    return this.isRunning;
  }
}

export const betAgent = new BetAgentRunner();
