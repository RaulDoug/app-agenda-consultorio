import express, { type Express } from 'express';
import { authMiddleware } from './middlewares/auth.js';
import { patientsRouter } from './routes/patients.js';
import { proceduresRouter } from './routes/procedures.js';
import { appointmentsRouter } from './routes/appointments.js';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/patients', patientsRouter);
  app.use('/api/procedures', proceduresRouter);
  app.use('/api/appointments', appointmentsRouter);

  return app;
}

export const app = createApp();
