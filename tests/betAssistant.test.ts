import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { fallbackRuleBasedParser } from '../server/src/ai/deepseekParser.ts';
import { mockSportsbook, nicebetSportsbook } from '../server/src/services/mockSportsbook.ts';
import { verificationEngine } from '../server/src/services/verificationEngine.ts';
import { browserController } from '../server/src/browser/browserController.ts';
import { SelectionValidator } from '../server/src/services/selectionValidator.ts';
import { aiAutoPickService } from '../server/src/services/aiAutoPickService.ts';
import { ParsedBetRequest } from '../server/src/types/index.ts';

describe('AI Bet Browser Assistant NiceBet Liberia Test Suite', () => {
  beforeAll(async () => {
    // Load real events from NiceBet Liberia API
    await mockSportsbook.refreshEvents();
  });

  beforeEach(() => {
    mockSportsbook.resetBetSlip();
    browserController.resetEmergencyStop();
  });

  // 1. AI instruction parsing with site's default betting options
  it('1. AI instruction parsing: correctly parses default betting options without splitting compound selections', () => {
    const rawText = `Set the site's default betting options to the following two options:

1. Market: **Multigoals**
   Selection: **0-5**

2. Market: **Multigoals 1 & Multigoals 2**
   Selection: **(1-4),(0-2)**`;

    const parsed = fallbackRuleBasedParser(rawText);

    expect(parsed.bets).toHaveLength(2);

    // Option 1
    expect(parsed.bets[0].market).toBe('Multigoals');
    expect(parsed.bets[0].selection).toBe('0-5');

    // Option 2: Must be one complete betting option, NOT split
    expect(parsed.bets[1].market).toBe('Multigoals 1 & Multigoals 2');
    expect(parsed.bets[1].selection).toBe('(1-4),(0-2)');
  });

  // 1b. Multi-event instruction parsing
  it('1b. Multi-event parsing: correctly parses default multi-match instructions', () => {
    const rawText = `Prepare a 500 LRD bet:

Portugal vs Wales
Market: Multigoals
Selection: 0-5

Norway vs Denmark
Market: Multigoals 1 & Multigoals 2
Selection: (1-4),(0-2)`;

    const parsed = fallbackRuleBasedParser(rawText);

    expect(parsed.stake).toBe(500);
    expect(parsed.currency).toBe('LRD');
    expect(parsed.bets).toHaveLength(2);

    expect(parsed.bets[0].event).toBe('Portugal vs Wales');
    expect(parsed.bets[0].market).toBe('Multigoals');
    expect(parsed.bets[0].selection).toBe('0-5');

    expect(parsed.bets[1].event).toBe('Norway vs Denmark');
    expect(parsed.bets[1].market).toBe('Multigoals 1 & Multigoals 2');
    expect(parsed.bets[1].selection).toBe('(1-4),(0-2)');
  });

  // 2. Event search on NiceBet
  it('2. Event search: finds real live events from NiceBet by team name or title', () => {
    const allEvents = mockSportsbook.getEvents();
    expect(allEvents.length).toBeGreaterThan(0);

    const firstEvent = allEvents[0];
    const foundByTitle = mockSportsbook.findEventByTeams(firstEvent.title);
    expect(foundByTitle).toBeDefined();
    expect(foundByTitle?.id).toBe(firstEvent.id);

    const foundByTeam = mockSportsbook.findEventByTeams(firstEvent.homeTeam);
    expect(foundByTeam).toBeDefined();
    expect(foundByTeam?.id).toBe(firstEvent.id);
  });

  // 3. Market search on NiceBet
  it('3. Market search: finds requested market inside NiceBet event and rejects non-existent markets', () => {
    const event = mockSportsbook.getEvents()[0];
    expect(event).toBeDefined();

    const existingMarket = event.markets[0];
    expect(existingMarket).toBeDefined();

    const foundMarket = mockSportsbook.findMarket(event, existingMarket.name);
    expect(foundMarket).toBeDefined();

    const nonExistent = mockSportsbook.findMarket(event, 'NonExistentFakeMarket999');
    expect(nonExistent).toBeUndefined();
  });

  // 4. Selection search on NiceBet
  it('4. Selection search: finds requested selection in market with valid live odds', () => {
    const event = mockSportsbook.getEvents()[0];
    const market = event.markets[0];
    const outcome = market.outcomes[0];

    const foundOutcome = mockSportsbook.findOutcome(event, market, outcome.name);
    expect(foundOutcome).toBeDefined();
    expect(foundOutcome?.odds).toBeGreaterThan(1.0);
  });

  // 5. Correct selection
  it('5. Correct selection: successfully adds real NiceBet selection to bet slip and calculates combined odds', () => {
    const event = mockSportsbook.getEvents()[0];
    const market = event.markets[0];
    const outcome = market.outcomes[0];

    const addRes = mockSportsbook.addSelection(event.id, market.name, outcome.name);

    expect(addRes.success).toBe(true);
    expect(addRes.item?.selection).toBe(outcome.name);
    expect(addRes.item?.odds).toBe(outcome.odds);

    const slip = mockSportsbook.getBetSlip();
    expect(slip.items).toHaveLength(1);
    expect(slip.totalOdds).toBe(outcome.odds);
  });

  // 5b. Default betting options selection & verification
  it('5b. Default betting options: adds Multigoals (0-5) and Multigoals 1 & Multigoals 2 ((1-4),(0-2)) as complete options', () => {
    const events = mockSportsbook.getEvents();
    const event1 = events[0];
    const event2 = events[1] || events[0];

    // Option 1: Multigoals -> 0-5
    const res1 = mockSportsbook.addSelection(event1.id, 'Multigoals', '0-5');
    expect(res1.success).toBe(true);
    expect(res1.item?.marketName).toBe('Multigoals');
    expect(res1.item?.selection).toBe('0-5');

    // Option 2: Multigoals 1 & Multigoals 2 -> (1-4),(0-2) (treated as ONE complete option)
    const res2 = mockSportsbook.addSelection(event2.id, 'Multigoals 1 & Multigoals 2', '(1-4),(0-2)');
    expect(res2.success).toBe(true);
    expect(res2.item?.marketName).toBe('Multigoals 1 & Multigoals 2');
    expect(res2.item?.selection).toBe('(1-4),(0-2)');

    const slip = mockSportsbook.getBetSlip();
    expect(slip.items).toHaveLength(2);
    expect(slip.items[0].selection).toBe('0-5');
    expect(slip.items[1].selection).toBe('(1-4),(0-2)');

    // Verify through verificationEngine
    const req: ParsedBetRequest = {
      stake: 10,
      currency: 'USD',
      bets: [
        { event: event1.title, market: 'Multigoals', selection: '0-5' },
        { event: event2.title, market: 'Multigoals 1 & Multigoals 2', selection: '(1-4),(0-2)' },
      ],
    };
    mockSportsbook.setStake(10, 'USD');
    const verification = verificationEngine.verify(req, mockSportsbook.getBetSlip());
    expect(verification.verified).toBe(true);
    expect(verification.status).toBe('MATCH');
  });

  // 6. Incorrect selection rejection
  it('6. Incorrect selection rejection: refuses to guess or invent selections that do not exist', () => {
    const event = mockSportsbook.getEvents()[0];
    const market = event.markets[0];

    const addRes = mockSportsbook.addSelection(event.id, market.name, 'InventedNonExistentSelectionXYZ');
    expect(addRes.success).toBe(false);
    expect(addRes.error).toContain('not found');
  });

  // 7. Stake validation
  it('7. Stake validation: sets valid positive stake and accurately computes potential return', () => {
    const event = mockSportsbook.getEvents()[0];
    const market = event.markets[0];
    const outcome = market.outcomes[0];

    mockSportsbook.addSelection(event.id, market.name, outcome.name);
    mockSportsbook.setStake(100, 'LRD');

    const slip = mockSportsbook.getBetSlip();
    expect(slip.stake).toBe(100);
    expect(slip.currency).toBe('LRD');
    expect(slip.totalOdds).toBe(outcome.odds);
    expect(slip.potentialReturn).toBe(Math.round(100 * outcome.odds * 100) / 100);
  });

  // 8. Bet-slip verification
  it('8. Bet-slip verification: compares user request against actual bet slip and flags mismatches', () => {
    const event = mockSportsbook.getEvents()[0];
    const market = event.markets[0];
    const outcome = market.outcomes[0];

    const req: ParsedBetRequest = {
      stake: 50,
      currency: 'USD',
      bets: [
        {
          event: event.title,
          market: market.name,
          selection: outcome.name,
        },
      ],
    };

    // Case A: Perfect match
    mockSportsbook.addSelection(event.id, market.name, outcome.name);
    mockSportsbook.setStake(50, 'USD');

    const matchResult = verificationEngine.verify(req, mockSportsbook.getBetSlip());
    expect(matchResult.verified).toBe(true);
    expect(matchResult.status).toBe('MATCH');

    // Case B: Selection mismatch
    mockSportsbook.resetBetSlip();
    const wrongOutcome = market.outcomes[1] || { name: 'OppositeTeam', odds: 3.5 };
    mockSportsbook.addSelection(event.id, market.name, wrongOutcome.name);
    mockSportsbook.setStake(50, 'USD');

    const mismatchResult = verificationEngine.verify(req, mockSportsbook.getBetSlip());
    expect(mismatchResult.verified).toBe(false);
    expect(mismatchResult.status).toBe('SELECTION MISMATCH');
    expect(mismatchResult.errors.length).toBeGreaterThan(0);
  });

  // 9. Emergency stop
  it('9. Emergency stop: halts browser controller actions immediately and sets isStopped flag', () => {
    expect(browserController.isStopped()).toBe(false);

    browserController.emergencyStop('Agent stopped by user.');
    expect(browserController.isStopped()).toBe(true);

    const status = browserController.getStatus();
    expect(status.agentStatus).toBe('Stopped');
    expect(status.currentAction).toBe('Agent stopped by user.');
  });

  // 10. Final transaction barrier
  it('10. Final transaction barrier: proves that the Playwright agent cannot click "PLACE BET" on NiceBet', () => {
    // Attempting to invoke safeClick with any place-bet target must throw an explicit safety exception
    expect(() => {
      browserController.assertSafeClickTarget('button:has-text("PLACE BET")');
    }).toThrow(/CRITICAL SAFETY BARRIER ENFORCED/);

    expect(() => {
      browserController.assertSafeClickTarget('button:has-text("Place Bet")');
    }).toThrow(/CRITICAL SAFETY BARRIER ENFORCED/);

    expect(() => {
      browserController.assertSafeClickTarget('button:has-text("LOGIN TO PLACE BET")');
    }).toThrow(/CRITICAL SAFETY BARRIER ENFORCED/);

    expect(() => {
      browserController.assertSafeClickTarget('#place-bet-btn');
    }).toThrow(/CRITICAL SAFETY BARRIER ENFORCED/);
  });

  // 11. AI AUTO PICK: SelectionValidator backend verification
  it('11. AI AUTO PICK: SelectionValidator enforces 10-point backend validation & strict 2.00-2.14 odds corridor', () => {
    // Valid combination: 1.40 × 1.50 = 2.10 (between 2.00 and 2.14)
    const validSelections = [
      {
        eventId: '16296441',
        teams: 'Real Madrid vs Atletico Madrid',
        market: 'Multigoals',
        selection: '0-5',
        odds: 1.40,
      },
      {
        eventId: '16296440',
        teams: 'Arsenal vs Chelsea',
        market: 'Multigoals 1 & Multigoals 2',
        selection: '(1-4),(0-2)',
        odds: 1.50,
      },
    ];

    const validResult = SelectionValidator.validate(validSelections);
    expect(validResult.isValid).toBe(true);
    expect(validResult.calculatedCombinedOdds).toBe(2.10);
    expect(validResult.errors).toHaveLength(0);

    // Invalid combination: Under min threshold (e.g. 1.20 × 1.40 = 1.68 < 2.00)
    const lowOddsSelections = [
      {
        eventId: '16296441',
        teams: 'Real Madrid vs Atletico Madrid',
        market: 'Multigoals',
        selection: '0-5',
        odds: 1.20,
      },
      {
        eventId: '16296440',
        teams: 'Arsenal vs Chelsea',
        market: 'Multigoals 1 & Multigoals 2',
        selection: '(1-4),(0-2)',
        odds: 1.40,
      },
    ];

    const lowResult = SelectionValidator.validate(lowOddsSelections);
    expect(lowResult.isValid).toBe(false);
    expect(lowResult.errors.some((e: string) => e.includes('below minimum'))).toBe(true);

    // Invalid combination: Over max threshold (e.g. 1.50 × 1.50 = 2.25 > 2.14)
    const highOddsSelections = [
      {
        eventId: '16296441',
        teams: 'Real Madrid vs Atletico Madrid',
        market: 'Multigoals',
        selection: '0-5',
        odds: 1.50,
      },
      {
        eventId: '16296440',
        teams: 'Arsenal vs Chelsea',
        market: 'Multigoals 1 & Multigoals 2',
        selection: '(1-4),(0-2)',
        odds: 1.50,
      },
    ];

    const highResult = SelectionValidator.validate(highOddsSelections);
    expect(highResult.isValid).toBe(false);
    expect(highResult.errors.some((e: string) => e.includes('above maximum'))).toBe(true);

    // Rejection of duplicate events in single combination
    const duplicateEventSelections = [
      {
        eventId: '16296441',
        teams: 'Real Madrid vs Atletico Madrid',
        market: 'Multigoals',
        selection: '0-5',
        odds: 1.40,
      },
      {
        eventId: '16296441',
        teams: 'Real Madrid vs Atletico Madrid',
        market: 'Multigoals 1 & Multigoals 2',
        selection: '(1-4),(0-2)',
        odds: 1.50,
      },
    ];

    const dupResult = SelectionValidator.validate(duplicateEventSelections);
    expect(dupResult.isValid).toBe(false);
    expect(dupResult.errors.some((e: string) => e.includes('Duplicate event detected'))).toBe(true);
  });

  // 12. AI AUTO PICK: Service execution and combination ranking
  it('12. AI AUTO PICK: aiAutoPickService generates candidate combinations and picks top statistical match within 2.00–2.14', async () => {
    const result = await aiAutoPickService.generateAutoPick(10, 'USD');

    expect(result.mode).toBe('AI_AUTO_PICK');
    expect(result.targetOdds.min).toBe(2.00);
    expect(result.targetOdds.max).toBe(2.14);
    expect(result.status).toBe('QUALIFIED');
    expect(result.selections.length).toBeGreaterThanOrEqual(2);
    expect(result.combinedOdds).toBeGreaterThanOrEqual(2.00);
    expect(result.combinedOdds).toBeLessThanOrEqual(2.14);

    // Selections must only be Option 1 or Option 2
    for (const sel of result.selections) {
      const isOption1 = sel.market === 'Multigoals' && sel.selection === '0-5';
      const isOption2 = sel.market === 'Multigoals 1 & Multigoals 2' && sel.selection === '(1-4),(0-2)';
      expect(isOption1 || isOption2).toBe(true);
      expect(sel.analysis).toBeDefined();
      expect(sel.confidence).toBeGreaterThan(0.5);
    }
  });

  // 13. AI AUTO PICK: Clickable Option 1 generates only Option 1 (Multigoals 0-5)
  it('13. AI AUTO PICK: Option 1 filter generates combinations exclusively from Multigoals 0-5 within 2.00–2.14', async () => {
    const result = await aiAutoPickService.generateAutoPick(10, 'USD', 'option1');

    expect(result.mode).toBe('AI_AUTO_PICK');
    expect(result.selectedOption).toBe('option1');
    expect(result.status).toBe('QUALIFIED');
    expect(result.combinedOdds).toBeGreaterThanOrEqual(2.00);
    expect(result.combinedOdds).toBeLessThanOrEqual(2.14);
    expect(result.selections.length).toBeGreaterThanOrEqual(1);

    for (const sel of result.selections) {
      expect(sel.market).toBe('Multigoals');
      expect(sel.selection).toBe('0-5');
    }
  });

  // 14. AI AUTO PICK: Clickable Option 2 generates only Option 2 (Multigoals 1 & Multigoals 2 (1-4),(0-2))
  it('14. AI AUTO PICK: Option 2 filter generates combinations exclusively from Multigoals 1 & Multigoals 2 (1-4),(0-2) within 2.00–2.14', async () => {
    const result = await aiAutoPickService.generateAutoPick(10, 'USD', 'option2');

    expect(result.mode).toBe('AI_AUTO_PICK');
    expect(result.selectedOption).toBe('option2');
    expect(result.status).toBe('QUALIFIED');
    expect(result.combinedOdds).toBeGreaterThanOrEqual(2.00);
    expect(result.combinedOdds).toBeLessThanOrEqual(2.14);
    expect(result.selections.length).toBeGreaterThanOrEqual(1);

    for (const sel of result.selections) {
      expect(sel.market).toBe('Multigoals 1 & Multigoals 2');
      expect(sel.selection).toBe('(1-4),(0-2)');
    }
  });
});
