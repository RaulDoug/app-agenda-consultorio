import express, { type Express } from 'express';
import { authMiddleware } from './middlewares/auth.js';
import { patientsRouter } from './routes/patients.js';
import { proceduresRouter } from './routes/procedures.js';
import { appointmentsRouter } from './routes/appointments.js';
import { syncRouter } from './routes/sync.js';
import { webhooksRouter } from './routes/webhooks.js';
import { financialRouter } from './routes/financial.js';
import { analyticsRouter } from './routes/analytics.js';
import { authRouter } from './routes/auth.js';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/patients', patientsRouter);
  app.use('/api/procedures', proceduresRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/webhooks', webhooksRouter);
  app.use('/api/financial', financialRouter);
  app.use('/api/analytics', analyticsRouter);

  return app;
}

export const app = createApp();
