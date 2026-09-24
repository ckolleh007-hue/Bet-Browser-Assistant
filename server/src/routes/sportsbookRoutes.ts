import { Router, Request, Response } from 'express';
import { mockSportsbook } from '../services/mockSportsbook.ts';

const router = Router();

// GET /api/sportsbook/events?q=...
router.get('/events', async (req: Request, res: Response) => {
  const query = req.query.q as string | undefined;
  let events = mockSportsbook.getEvents(query);
  if (events.length === 0) {
    events = await mockSportsbook.refreshEvents();
    if (query) {
      events = mockSportsbook.getEvents(query);
    }
  }
  res.json({ success: true, events, source: 'https://www.nicebet.com.lr/' });
});

// POST /api/sportsbook/refresh
router.post('/refresh', async (_req: Request, res: Response) => {
  const events = await mockSportsbook.refreshEvents();
  res.json({ success: true, count: events.length, events });
});

// GET /api/sportsbook/events/:id/markets
router.get('/events/:id/markets', async (req: Request, res: Response) => {
  const markets = await mockSportsbook.loadFullEventMarkets(req.params.id);
  res.json({ success: true, markets });
});

// GET /api/sportsbook/bet-slip
router.get('/bet-slip', (_req: Request, res: Response) => {
  const slip = mockSportsbook.getBetSlip();
  res.json({ success: true, slip });
});

// POST /api/sportsbook/bet-slip/add
router.post('/bet-slip/add', (req: Request, res: Response) => {
  const { eventId, marketName, selection } = req.body;
  const result = mockSportsbook.addSelection(eventId, marketName, selection);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true, slip: mockSportsbook.getBetSlip() });
});

// POST /api/sportsbook/bet-slip/remove
router.post('/bet-slip/remove', (req: Request, res: Response) => {
  const { eventId, marketId } = req.body;
  const slip = mockSportsbook.removeSelection(eventId, marketId);
  res.json({ success: true, slip });
});

// POST /api/sportsbook/bet-slip/stake
router.post('/bet-slip/stake', (req: Request, res: Response) => {
  const { stake, currency } = req.body;
  const slip = mockSportsbook.setStake(Number(stake), currency || 'USD');
  res.json({ success: true, slip });
});

// POST /api/sportsbook/bet-slip/reset
router.post('/bet-slip/reset', (_req: Request, res: Response) => {
  const slip = mockSportsbook.resetBetSlip();
  res.json({ success: true, slip });
});

/**
 * MANDATORY SAFETY BARRIER:
 * This endpoint can ONLY be triggered by a human user manual confirmation click.
 * Automation is strictly barred from invoking it.
 */
router.post('/confirm-bet', (req: Request, res: Response) => {
  const isHumanConfirmed = req.body.isHumanConfirmed === true;
  if (!isHumanConfirmed) {
    res.status(403).json({
      error: 'CRITICAL SAFETY VIOLATION: Manual human confirmation is strictly required on NiceBet.',
    });
    return;
  }

  const result = mockSportsbook.confirmPlaceBetByUser();
  if (!result.success) {
    res.status(400).json({ error: result.message });
    return;
  }

  res.json({
    success: true,
    message: result.message,
    slip: mockSportsbook.getBetSlip(),
  });
});

export default router;
