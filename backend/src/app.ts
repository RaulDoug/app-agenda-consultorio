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
import { whatsappSessionRouter } from './routes/whatsapp.js';
import { businessHoursRouter } from './routes/business-hours.js';
import { scheduleBlocksRouter } from './routes/schedule-blocks.js';

export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/whatsapp', whatsappSessionRouter);
  app.use('/api/business-hours', businessHoursRouter);
  app.use('/api/schedule-blocks', scheduleBlocksRouter);
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

// Inicialização automática quando executado diretamente como servidor
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  const isDirectRun = process.argv[1]?.includes('app.ts') || process.argv[1]?.includes('app.js');
  if (isDirectRun) {
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    app.listen(PORT, () => {
      console.log(`[CliniAssist Backend] Servidor rodando na porta ${PORT} (http://localhost:${PORT})`);
    });
  }
}
