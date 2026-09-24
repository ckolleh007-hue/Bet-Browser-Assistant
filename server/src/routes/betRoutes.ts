import { Router, Request, Response } from 'express';
import { parseBetInstructionsWithDeepSeek } from '../ai/deepseekParser.ts';
import { db } from '../database/index.ts';
import { betAgent } from '../agent/betAgent.ts';
import { ParsedBetRequest } from '../types/index.ts';

const router = Router();

// POST /api/bets/parse
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { instructions } = req.body;
    if (!instructions || typeof instructions !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "instructions" string' });
      return;
    }

    const parsed = await parseBetInstructionsWithDeepSeek(instructions);
    res.json({ success: true, parsed });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to parse instructions' });
  }
});

// POST /api/bets/start
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { parsed, rawInstructions } = req.body as {
      parsed: ParsedBetRequest;
      rawInstructions?: string;
    };

    if (!parsed || !Array.isArray(parsed.bets)) {
      res.status(400).json({ error: 'Invalid parsed bet structure' });
      return;
    }

    // Create record in database
    const betRequest = await db.createBetRequest(
      parsed,
      rawInstructions || JSON.stringify(parsed, null, 2)
    );

    // Launch agent execution asynchronously so frontend receives request ID immediately
    // and can subscribe / poll activity logs and live state
    betAgent.run(betRequest, parsed).catch((err) => {
      console.error('[BetAgent Error]', err);
    });

    res.json({
      success: true,
      betRequestId: betRequest.id,
      record: betRequest,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to start bet agent' });
  }
});

// POST /api/bets/stop - Emergency stop
router.post('/stop', async (_req: Request, res: Response) => {
  try {
    betAgent.emergencyStop();
    res.json({
      success: true,
      message: 'Agent stopped by user. All Playwright actions halted.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to stop agent' });
  }
});

// GET /api/bets/recent - Recent bet history
router.get('/history/all', async (_req: Request, res: Response) => {
  try {
    const list = await db.getAllBetRequests();
    res.json({ success: true, list });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve bet history' });
  }
});

// GET /api/bets/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const record = await db.getBetRequest(req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Bet request not found' });
      return;
    }
    res.json({ success: true, record });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve bet request' });
  }
});

// GET /api/bets/:id/activity
router.get('/:id/activity', async (req: Request, res: Response) => {
  try {
    const logs = await db.getActivityLogs(req.params.id);
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve activity logs' });
  }
});

// GET /api/bets/activity/all
router.get('/activity/all', async (_req: Request, res: Response) => {
  try {
    const logs = await db.getActivityLogs();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve activity logs' });
  }
});

export default router;
