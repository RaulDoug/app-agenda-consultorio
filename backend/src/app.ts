import express, { type Express } from 'express';
import { authMiddleware } from './middlewares/auth.js';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

export const app = createApp();
