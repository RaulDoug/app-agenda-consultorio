import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { getDatabase } from '../db/connection.js';

export const scheduleBlocksRouter = Router();

scheduleBlocksRouter.use(authMiddleware);

// GET /api/schedule-blocks: Lista bloqueios ativos
scheduleBlocksRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const db = (req as any).db || getDatabase();

    const result = await db.query(
      `SELECT id, tenant_id, title, start_time, end_time, created_at, updated_at
       FROM schedule_blocks
       WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY start_time ASC`,
      [tenantId]
    );

    res.status(200).json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao listar bloqueios.', details: err.message });
  }
});

// POST /api/schedule-blocks: Cria novo bloqueio de agenda
scheduleBlocksRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const db = (req as any).db || getDatabase();
    const { title, start_time, end_time } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Título do bloqueio é obrigatório.' });
      return;
    }

    if (!start_time || !end_time) {
      res.status(400).json({ error: 'start_time e end_time são obrigatórios.' });
      return;
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ error: 'Datas de início ou término inválidas.' });
      return;
    }

    if (end.getTime() <= start.getTime()) {
      res.status(400).json({ error: 'O término do bloqueio deve ser posterior ao início.' });
      return;
    }

    const insertRes = await db.query(
      `INSERT INTO schedule_blocks (tenant_id, title, start_time, end_time, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, tenant_id, title, start_time, end_time, created_at, updated_at`,
      [tenantId, title.trim(), start.toISOString(), end.toISOString()]
    );

    res.status(201).json(insertRes.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao criar bloqueio de agenda.', details: err.message });
  }
});

// DELETE /api/schedule-blocks/:id: Soft Delete de bloqueio
scheduleBlocksRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const db = (req as any).db || getDatabase();
    const { id } = req.params;

    const result = await db.query(
      `UPDATE schedule_blocks
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Bloqueio não encontrado ou já removido.' });
      return;
    }

    res.status(200).json({ message: 'Bloqueio removido com sucesso (Soft Delete).' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao remover bloqueio.', details: err.message });
  }
});
