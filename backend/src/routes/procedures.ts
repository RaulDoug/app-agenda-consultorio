import { Router } from 'express';
import { ProcedureRepository } from '../repositories/procedure-repository.js';
import { authMiddleware } from '../middlewares/auth.js';

export const proceduresRouter = Router();
const procedureRepo = new ProcedureRepository();

proceduresRouter.use(authMiddleware);

// Listagem de procedimentos ativos
proceduresRouter.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const procedures = await procedureRepo.findAll(tenantId);
    res.json(procedures);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Busca por ID
proceduresRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const procedure = await procedureRepo.findById(tenantId, req.params.id);
    if (!procedure) {
      res.status(404).json({ error: 'Procedimento não encontrado.' });
      return;
    }
    res.json(procedure);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cadastro On-the-Fly de procedimento
proceduresRouter.post('/', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const { name, default_duration_minutes, default_price_cents, id } = req.body;

    if (!name || default_duration_minutes === undefined || default_price_cents === undefined) {
      res.status(400).json({ error: 'Nome, duração e preço são obrigatórios.' });
      return;
    }

    if (default_duration_minutes <= 0) {
      res.status(400).json({ error: 'Duração deve ser maior que zero.' });
      return;
    }

    if (default_price_cents < 0) {
      res.status(400).json({ error: 'Preço não pode ser negativo.' });
      return;
    }

    const procedure = await procedureRepo.create(tenantId, {
      name,
      default_duration_minutes,
      default_price_cents,
    }, id);

    res.status(201).json(procedure);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Soft Delete de procedimento
proceduresRouter.delete('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const success = await procedureRepo.softDelete(tenantId, req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Procedimento não encontrado.' });
      return;
    }
    res.json({ message: 'Procedimento desativado com sucesso (Soft Delete).' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
