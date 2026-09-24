import { Router, Request, Response } from 'express';
import { browserController } from '../browser/browserController.ts';
import { betAgent } from '../agent/betAgent.ts';

const router = Router();

// GET /api/browser/status
router.get('/status', (_req: Request, res: Response) => {
  const status = browserController.getStatus();
  res.json({
    success: true,
    status,
    isAgentRunning: betAgent.isAgentRunning(),
  });
});

// POST /api/browser/start
router.post('/start', async (_req: Request, res: Response) => {
  try {
    await browserController.startBrowser();
    res.json({
      success: true,
      message: 'Chromium browser session started.',
      status: browserController.getStatus(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to start browser' });
  }
});

// POST /api/browser/stop
router.post('/stop', async (_req: Request, res: Response) => {
  try {
    betAgent.emergencyStop();
    await browserController.stopBrowser();
    res.json({
      success: true,
      message: 'Browser session stopped.',
      status: browserController.getStatus(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to stop browser' });
  }
});

export default router;
