import express, { type Express } from 'express';
import { authMiddleware } from './middlewares/auth.js';
import { patientsRouter } from './routes/patients.js';
import { proceduresRouter } from './routes/procedures.js';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/patients', patientsRouter);
  app.use('/api/procedures', proceduresRouter);

  return app;
}

export const app = createApp();
