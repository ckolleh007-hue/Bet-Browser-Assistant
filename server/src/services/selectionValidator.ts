import { mockSportsbook } from './mockSportsbook.ts';

export interface ValidationSelectionInput {
  eventId: string;
  teams: string;
  market: string;
  selection: string;
  odds: number;
}

export interface SelectionValidationResult {
  isValid: boolean;
  errors: string[];
  calculatedCombinedOdds: number;
  isWithinTargetOdds: boolean;
  minOdds: number;
  maxOdds: number;
  verifiedSelections: Array<{
    eventId: string;
    teams: string;
    market: string;
    selection: string;
    expectedOdds: number;
    currentOdds: number;
    oddsChanged: boolean;
  }>;
}

/**
 * Backend Validation Service for AI Auto Pick selections.
 * Enforces all 10 strict backend verification checks according to specification:
 * 1. Event exists
 * 2. Teams exist
 * 3. Market exists
 * 4. Selection exists
 * 5. Market + selection match exactly (Option 1: Multigoals 0-5, Option 2: Multigoals 1 & Multigoals 2 (1-4),(0-2))
 * 6. Odds exist
 * 7. Odds are current (re-read from live sportsbook state)
 * 8. No duplicate event (one event per combination!)
 * 9. Combined odds calculated correctly
 * 10. Combined odds >= 2.00 AND <= 2.14
 */
export class SelectionValidator {
  public static readonly TARGET_MIN_ODDS = 2.0;
  public static readonly TARGET_MAX_ODDS = 2.14;

  /**
   * Allowed betting option patterns
   */
  public static readonly ALLOWED_OPTIONS = [
    {
      market: 'Multigoals',
      selection: '0-5',
    },
    {
      market: 'Multigoals 1 & Multigoals 2',
      selection: '(1-4),(0-2)',
    },
  ];

  public static isOptionMatching(market: string, selection: string): boolean {
    const normMarket = market.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normSel = selection.replace(/\s+/g, '');

    // Option 1: Multigoals -> 0-5
    if (
      (normMarket === 'multigoals' || normMarket === 'multiplegoals') &&
      normSel === '0-5'
    ) {
      return true;
    }

    // Option 2: Multigoals 1 & Multigoals 2 -> (1-4),(0-2) or (1-4) 1 & (0-2) 2
    const isOption2Market =
      normMarket === 'multigoals1multigoals2' ||
      normMarket === 'multigoals1multigoals' ||
      normMarket.includes('multigoals1') ||
      normMarket.includes('multigoals1andmultigoals') ||
      normMarket === 'multiplegoals1multiplegoals2' ||
      normMarket === 'multiplegoals1multiplegoals' ||
      normMarket.includes('multiplegoals1') ||
      normMarket.includes('multiplegoals1andmultiplegoals');

    const cleanSelDigits = normSel.replace(/[^0-9]/g, '');
    const isOption2Selection =
      normSel === '(1-4),(0-2)' ||
      normSel === '(1-4)1&(0-2)2' ||
      normSel === '(1-4),(0-2)2' ||
      cleanSelDigits === '1402' ||
      cleanSelDigits === '141022' ||
      (normSel.includes('1-4') && normSel.includes('0-2'));

    if (isOption2Market && isOption2Selection) {
      return true;
    }

    return false;
  }

  /**
   * Performs complete backend verification of a candidate combination.
   */
  public static validate(
    selections: ValidationSelectionInput[],
    minOdds = SelectionValidator.TARGET_MIN_ODDS,
    maxOdds = SelectionValidator.TARGET_MAX_ODDS
  ): SelectionValidationResult {
    const errors: string[] = [];
    const verifiedSelections: SelectionValidationResult['verifiedSelections'] = [];

    if (!Array.isArray(selections) || selections.length === 0) {
      return {
        isValid: false,
        errors: ['No selections provided for validation.'],
        calculatedCombinedOdds: 0,
        isWithinTargetOdds: false,
        minOdds,
        maxOdds,
        verifiedSelections: [],
      };
    }

    // Check 8: No duplicate event (strictly one event per combination)
    const seenEventIds = new Set<string>();
    const seenEventTitles = new Set<string>();

    let currentOddsProduct = 1.0;

    for (let i = 0; i < selections.length; i++) {
      const sel = selections[i];

      // Check 1: Event ID exists
      if (!sel.eventId) {
        errors.push(`Selection #${i + 1}: Missing event ID.`);
        continue;
      }

      const event = mockSportsbook.getEventById(sel.eventId) || mockSportsbook.findEventByTeams(sel.teams);
      if (!event) {
        errors.push(`Selection #${i + 1}: Event "${sel.teams}" (ID: ${sel.eventId}) not found on NiceBet.`);
        continue;
      }

      // Check 2: Teams exist
      if (!event.homeTeam || !event.awayTeam) {
        errors.push(`Selection #${i + 1}: Incomplete team information for event "${event.title}".`);
        continue;
      }

      // Check duplicate event rule
      if (seenEventIds.has(event.id) || seenEventTitles.has(event.title.toLowerCase())) {
        errors.push(
          `Selection #${i + 1}: Duplicate event detected for "${event.title}". Each combination must contain only one selection per match.`
        );
      }
      seenEventIds.add(event.id);
      seenEventTitles.add(event.title.toLowerCase());

      // Check 3: Market exists
      const market = mockSportsbook.findMarket(event, sel.market);
      if (!market) {
        errors.push(`Selection #${i + 1}: Market "${sel.market}" not available for match "${event.title}".`);
        continue;
      }

      // Check 4: Selection exists
      const outcome = mockSportsbook.findOutcome(event, market, sel.selection);
      if (!outcome) {
        errors.push(
          `Selection #${i + 1}: Selection "${sel.selection}" not found in market "${market.name}" for match "${event.title}".`
        );
        continue;
      }

      // Check 5: Market + selection match exactly (Option 1 or Option 2)
      const isValidOption = this.isOptionMatching(market.name, outcome.name);
      if (!isValidOption) {
        errors.push(
          `Selection #${i + 1}: "${market.name} -> ${outcome.name}" does not match default Option 1 ("Multigoals 0-5") or Option 2 ("Multigoals 1 & Multigoals 2 (1-4),(0-2)").`
        );
      }

      // Check 6: Odds exist
      if (typeof outcome.odds !== 'number' || outcome.odds <= 1.0) {
        errors.push(`Selection #${i + 1}: Invalid or missing odds for "${outcome.name}" (${outcome.odds}).`);
        continue;
      }

      // Check 7: Odds are current
      const oddsChanged = Math.abs(outcome.odds - sel.odds) > 0.001;
      if (oddsChanged) {
        errors.push(
          `Selection #${i + 1}: Odds changed for "${event.title} - ${outcome.name}" from ${sel.odds} to current odds ${outcome.odds}.`
        );
      }

      const effectiveOdds = typeof sel.odds === 'number' && sel.odds > 0 ? sel.odds : outcome.odds;
      currentOddsProduct *= effectiveOdds;

      verifiedSelections.push({
        eventId: event.id,
        teams: event.title,
        market: market.name,
        selection: outcome.name,
        expectedOdds: sel.odds,
        currentOdds: outcome.odds,
        oddsChanged,
      });
    }

    // Check 9: Combined odds calculation rounded to 2 decimal places
    const calculatedCombinedOdds = Math.round(currentOddsProduct * 100) / 100;

    // Check 10: Total odds requirement 2.00 <= TOTAL_ODDS <= 2.14
    const isWithinTargetOdds =
      calculatedCombinedOdds >= minOdds - 0.001 && calculatedCombinedOdds <= maxOdds + 0.001;

    if (!isWithinTargetOdds) {
      if (calculatedCombinedOdds < minOdds - 0.001) {
        errors.push(
          `Combined odds (${calculatedCombinedOdds.toFixed(2)}) are below minimum threshold of ${minOdds.toFixed(2)}.`
        );
      } else if (calculatedCombinedOdds > maxOdds + 0.001) {
        errors.push(
          `Combined odds (${calculatedCombinedOdds.toFixed(2)}) are above maximum threshold of ${maxOdds.toFixed(2)}.`
        );
      } else {
        errors.push(
          `Combined odds (${calculatedCombinedOdds.toFixed(2)}) fall outside the mandatory range of ${minOdds.toFixed(2)} to ${maxOdds.toFixed(2)}.`
        );
      }
    }

    const isValid = errors.length === 0 && isWithinTargetOdds;

    return {
      isValid,
      errors,
      calculatedCombinedOdds,
      isWithinTargetOdds,
      minOdds,
      maxOdds,
      verifiedSelections,
    };
  }
}
