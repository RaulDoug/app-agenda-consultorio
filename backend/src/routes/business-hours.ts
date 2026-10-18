import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { getDatabase } from '../db/connection.js';

export const businessHoursRouter = Router();

businessHoursRouter.use(authMiddleware);

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return h * 60 + m;
}

// GET /api/business-hours: Retorna os horários configurados para o tenant
businessHoursRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const db = (req as any).db || getDatabase();

    const result = await db.query(
      `SELECT id, tenant_id, day_of_week, is_open, start_time, end_time, break_start_time, break_end_time
       FROM business_hours
       WHERE tenant_id = $1
       ORDER BY day_of_week ASC`,
      [tenantId]
    );

    res.status(200).json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar expediente.', details: err.message });
  }
});

// PUT /api/business-hours: Atualiza ou insere horários de funcionamento
businessHoursRouter.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const db = (req as any).db || getDatabase();
    const hoursList = Array.isArray(req.body) ? req.body : [req.body];

    if (hoursList.length === 0) {
      res.status(400).json({ error: 'Nenhum horário fornecido.' });
      return;
    }

    // Validação de consistência
    for (const h of hoursList) {
      if (typeof h.day_of_week !== 'number' || h.day_of_week < 0 || h.day_of_week > 6) {
        res.status(400).json({ error: 'day_of_week deve estar entre 0 (Domingo) e 6 (Sábado).' });
        return;
      }

      if (h.is_open) {
        if (!h.start_time || !h.end_time) {
          res.status(400).json({ error: 'start_time e end_time são obrigatórios para dias com expediente.' });
          return;
        }

        const startMin = timeToMinutes(h.start_time);
        const endMin = timeToMinutes(h.end_time);

        if (endMin <= startMin) {
          res.status(400).json({ error: 'O horário de término deve ser posterior ao horário de início.' });
          return;
        }

        if (h.break_start_time && h.break_end_time) {
          const breakStart = timeToMinutes(h.break_start_time);
          const breakEnd = timeToMinutes(h.break_end_time);

          if (breakEnd <= breakStart) {
            res.status(400).json({ error: 'O término do intervalo deve ser posterior ao início do intervalo.' });
            return;
          }

          if (breakStart < startMin || breakEnd > endMin) {
            res.status(400).json({ error: 'O intervalo de almoço deve estar contido dentro do horário de expediente.' });
            return;
          }
        }
      }
    }

    // Upsert para cada dia
    for (const h of hoursList) {
      const existing = await db.query(
        `SELECT id FROM business_hours WHERE tenant_id = $1 AND day_of_week = $2`,
        [tenantId, h.day_of_week]
      );

      if (existing.rows.length === 0) {
        await db.query(
          `INSERT INTO business_hours 
           (tenant_id, day_of_week, is_open, start_time, end_time, break_start_time, break_end_time, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
          [
            tenantId,
            h.day_of_week,
            Boolean(h.is_open),
            h.start_time || '08:00',
            h.end_time || '18:00',
            h.break_start_time || null,
            h.break_end_time || null,
          ]
        );
      } else {
        await db.query(
          `UPDATE business_hours
           SET is_open = $3, start_time = $4, end_time = $5, break_start_time = $6, break_end_time = $7, updated_at = CURRENT_TIMESTAMP
           WHERE tenant_id = $1 AND day_of_week = $2`,
          [
            tenantId,
            h.day_of_week,
            Boolean(h.is_open),
            h.start_time || '08:00',
            h.end_time || '18:00',
            h.break_start_time || null,
            h.break_end_time || null,
          ]
        );
      }
    }

    const updated = await db.query(
      `SELECT id, tenant_id, day_of_week, is_open, start_time, end_time, break_start_time, break_end_time
       FROM business_hours
       WHERE tenant_id = $1
       ORDER BY day_of_week ASC`,
      [tenantId]
    );

    res.status(200).json(updated.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao salvar expediente.', details: err.message });
  }
});
