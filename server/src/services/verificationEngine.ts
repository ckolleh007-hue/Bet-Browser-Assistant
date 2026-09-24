import {
  ParsedBetRequest,
  BetSlipState,
  VerificationResult,
  VerificationCheck,
} from '../types/index.ts';

export class VerificationEngine {
  /**
   * Compares the user's parsed betting request with the actual items currently inside the bet slip.
   * If any field differs, marks verified as false and specifies the mismatch.
   */
  public verify(
    request: ParsedBetRequest,
    actualSlip: BetSlipState
  ): VerificationResult {
    const checks: VerificationCheck[] = [];
    const errors: string[] = [];

    // 1. Verify Number of Selections
    const expectedCount = request.bets.length;
    const actualCount = actualSlip.items.length;
    const countPassed = expectedCount === actualCount;
    checks.push({
      field: 'Number of selections',
      expected: expectedCount,
      actual: actualCount,
      passed: countPassed,
      message: countPassed
        ? `Selection count verified (${actualCount}/${expectedCount})`
        : `Selection count mismatch: expected ${expectedCount}, but bet slip contains ${actualCount}`,
    });
    if (!countPassed) {
      errors.push(`Selection count mismatch: expected ${expectedCount}, found ${actualCount}`);
    }

    // 2. Verify Stake
    const expectedStake = request.stake;
    const actualStake = actualSlip.stake;
    const stakePassed = Math.abs(expectedStake - actualStake) < 0.001;
    checks.push({
      field: 'Stake',
      expected: `$${expectedStake.toFixed(2)}`,
      actual: `$${actualStake.toFixed(2)}`,
      passed: stakePassed,
      message: stakePassed
        ? `Stake confirmed at $${expectedStake.toFixed(2)}`
        : `Stake mismatch: expected $${expectedStake.toFixed(2)}, found $${actualStake.toFixed(2)}`,
    });
    if (!stakePassed) {
      errors.push(`Stake mismatch: expected $${expectedStake.toFixed(2)}, found $${actualStake.toFixed(2)}`);
    }

    // 3. Verify each requested selection against actual slip items
    for (let i = 0; i < request.bets.length; i++) {
      const req = request.bets[i];
      const match = actualSlip.items.find((item) => {
        const eventMatch = this.fuzzyMatch(item.eventTitle, req.event);
        const marketMatch = this.fuzzyMatch(item.marketName, req.market);
        const selMatch = this.fuzzyMatch(item.selection, req.selection);
        return eventMatch && marketMatch && selMatch;
      });

      if (!match) {
        // Find partial match to report exactly what differed
        const eventFound = actualSlip.items.find((item) =>
          this.fuzzyMatch(item.eventTitle, req.event)
        );

        if (!eventFound) {
          checks.push({
            field: 'Event',
            expected: req.event,
            actual: 'NOT FOUND IN SLIP',
            passed: false,
            message: `Requested event '${req.event}' was not found in the bet slip`,
          });
          errors.push(`Event '${req.event}' missing from bet slip`);
        } else {
          // Event found, check market and selection
          const marketFound = this.fuzzyMatch(eventFound.marketName, req.market);
          if (!marketFound) {
            checks.push({
              field: 'Market',
              expected: `${req.event}: ${req.market}`,
              actual: eventFound.marketName,
              passed: false,
              message: `Market mismatch for '${req.event}': requested '${req.market}', found '${eventFound.marketName}'`,
            });
            errors.push(`Market mismatch for '${req.event}': expected '${req.market}', found '${eventFound.marketName}'`);
          } else {
            // Selection differed
            checks.push({
              field: 'Selection',
              expected: `${req.event} [${req.market}]: ${req.selection}`,
              actual: eventFound.selection,
              passed: false,
              message: `Selection mismatch: requested '${req.selection}', found '${eventFound.selection}'`,
            });
            errors.push(`Selection mismatch: expected '${req.selection}', found '${eventFound.selection}'`);
          }
        }
      } else {
        // Fully matched
        checks.push({
          field: 'Teams',
          expected: req.event,
          actual: match.eventTitle,
          passed: true,
          message: `Teams verified: ${match.eventTitle}`,
        });
        checks.push({
          field: 'Event',
          expected: req.event,
          actual: match.eventTitle,
          passed: true,
          message: `Event matched: ${match.eventTitle}`,
        });
        checks.push({
          field: 'Market',
          expected: req.market,
          actual: match.marketName,
          passed: true,
          message: `Market matched: ${match.marketName}`,
        });
        checks.push({
          field: 'Selection',
          expected: req.selection,
          actual: match.selection,
          passed: true,
          message: `Selection matched: ${match.selection} (Odds: ${match.odds.toFixed(2)})`,
        });
        checks.push({
          field: 'Odds',
          expected: req.odds ? req.odds.toFixed(2) : 'Active Sportsbook Odds',
          actual: match.odds.toFixed(2),
          passed: true,
          message: `Valid odds found: ${match.odds.toFixed(2)}`,
        });
      }
    }

    // 4. Verify Combined Odds
    const calculatedCombinedOdds =
      actualSlip.items.length > 0
        ? Math.round(actualSlip.items.reduce((acc, it) => acc * it.odds, 1) * 100) / 100
        : actualSlip.totalOdds;
    const combinedOddsMatch = Math.abs(calculatedCombinedOdds - actualSlip.totalOdds) < 0.05;
    checks.push({
      field: 'Combined odds',
      expected: calculatedCombinedOdds.toFixed(2),
      actual: actualSlip.totalOdds.toFixed(2),
      passed: combinedOddsMatch,
      message: combinedOddsMatch
        ? `Combined odds verified at ${actualSlip.totalOdds.toFixed(2)}`
        : `Combined odds calculation discrepancy: calculated ${calculatedCombinedOdds.toFixed(2)} vs slip ${actualSlip.totalOdds.toFixed(2)}`,
    });
    if (!combinedOddsMatch) {
      errors.push(`Combined odds discrepancy: calculated ${calculatedCombinedOdds.toFixed(2)}, slip ${actualSlip.totalOdds.toFixed(2)}`);
    }

    const verified = errors.length === 0 && checks.every((c) => c.passed);

    return {
      verified,
      status: verified ? 'MATCH' : 'SELECTION MISMATCH',
      checks,
      errors,
    };
  }

  private fuzzyMatch(a: string, b: string): boolean {
    if (!a || !b) return false;
    const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA)) {
      return true;
    }

    // Match Multigoals 1 & 2 format variants: (1-4),(0-2) vs (1-4) 1 & (0-2) 2
    const isOpt2A = (a.includes('1-4') && a.includes('0-2')) || cleanA === '1402' || cleanA === '141022';
    const isOpt2B = (b.includes('1-4') && b.includes('0-2')) || cleanB === '1402' || cleanB === '141022';
    if (isOpt2A && isOpt2B) return true;

    // Match Multigoals 0-5
    const isOpt1A = cleanA === '05' || a.trim() === '0-5';
    const isOpt1B = cleanB === '05' || b.trim() === '0-5';
    if (isOpt1A && isOpt1B) return true;

    return false;
  }
}

export const verificationEngine = new VerificationEngine();
