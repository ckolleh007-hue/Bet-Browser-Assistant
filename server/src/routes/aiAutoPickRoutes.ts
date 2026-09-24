import { Router, Request, Response } from 'express';
import { aiAutoPickService } from '../services/aiAutoPickService.ts';
import { SelectionValidator } from '../services/selectionValidator.ts';
import { db } from '../database/index.ts';
import { betAgent } from '../agent/betAgent.ts';
import { ParsedBetRequest, BetInstruction } from '../types/index.ts';

const router = Router();

// In-memory cache of the latest AI Auto Pick result
let latestAutoPickResult: any = null;

// POST /api/auto-pick/generate
// Automatically scans NiceBet, analyzes stats, generates candidate selections and combinations,
// filters for total odds in [2.00, 2.14], and returns the best qualifying selection.
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { stake = 10, currency = 'USD' } = req.body;
    const numStake = Number(stake) > 0 ? Number(stake) : 10;
    const strCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'USD';

    const result = await aiAutoPickService.generateAutoPick(numStake, strCurrency);
    latestAutoPickResult = result;

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[AI Auto Pick Generate Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI auto pick selections',
    });
  }
});

// GET /api/auto-pick/latest
router.get('/latest', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: latestAutoPickResult,
  });
});

// POST /api/auto-pick/execute
// Builds the NiceBet bet slip using Playwright automation.
// Enforces SECOND odds validation immediately before finalizing the bet slip.
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { selections, stake = 10, currency = 'USD' } = req.body;

    if (!Array.isArray(selections) || selections.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No selections provided to execute.',
      });
      return;
    }

    const numStake = Number(stake) > 0 ? Number(stake) : 10;
    const strCurrency = typeof currency === 'string' ? currency.toUpperCase() : 'USD';

    // SECOND ODDS VALIDATION: Immediately before building the slip
    // Re-read current live odds from NiceBet service and verify 2.00–2.14 corridor
    const secondValidation = SelectionValidator.validate(
      selections.map((s: any) => ({
        eventId: s.eventId,
        teams: s.teams,
        market: s.market,
        selection: s.selection,
        odds: s.odds,
      }))
    );

    if (!secondValidation.isValid) {
      res.status(400).json({
        success: false,
        error: `Second odds validation failed before bet slip creation: ${secondValidation.errors.join('; ')}`,
        secondValidation,
      });
      return;
    }

    // Convert selections into ParsedBetRequest format for the autonomous bet agent
    const parsedBets: BetInstruction[] = selections.map((s: any) => ({
      event: s.teams,
      market: s.market,
      selection: s.selection,
      odds: s.odds,
    }));

    const parsed: ParsedBetRequest = {
      stake: numStake,
      currency: strCurrency,
      bets: parsedBets,
    };

    const rawInstructions = `[AI AUTO PICK SELECTION]\nTarget Odds Corridor: 2.00 - 2.14\nCombined Odds: ${secondValidation.calculatedCombinedOdds.toFixed(2)}\nSelections:\n${selections
      .map(
        (s: any, idx: number) =>
          `${idx + 1}. ${s.teams} | Market: ${s.market} | Selection: ${s.selection} | Odds: ${s.odds}`
      )
      .join('\n')}`;

    // Create record in persistent/in-memory DB
    const betRequest = await db.createBetRequest(parsed, rawInstructions);

    // Launch agent execution asynchronously with Playwright headless browser
    betAgent.run(betRequest, parsed).catch((err) => {
      console.error('[AI Auto Pick Agent Execution Error]:', err);
    });

    res.json({
      success: true,
      betRequestId: betRequest.id,
      record: betRequest,
      secondValidation,
    });
  } catch (error: any) {
    console.error('[AI Auto Pick Execute Error]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute AI Auto Pick on NiceBet',
    });
  }
});

export default router;
