import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import betRoutes from './server/src/routes/betRoutes.ts';
import browserRoutes from './server/src/routes/browserRoutes.ts';
import sportsbookRoutes from './server/src/routes/sportsbookRoutes.ts';
import aiAutoPickRoutes from './server/src/routes/aiAutoPickRoutes.ts';
import { db } from './server/src/database/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Endpoints
app.use('/api/bets', betRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/sportsbook', sportsbookRoutes);
app.use('/api/auto-pick', aiAutoPickRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Bet Browser Assistant API',
  });
});

async function startServer() {
  // Initialize Database schemas & connection
  await db.init();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[AI Bet Browser Assistant] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error] Failed to start:', err);
  process.exit(1);
});
