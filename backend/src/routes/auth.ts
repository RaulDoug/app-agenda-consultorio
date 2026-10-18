import { Router, type Request, type Response } from 'express';
import { loginWithCredentials } from '../services/auth-service.js';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(401).json({ error: 'Credenciais inválidas ou acesso não autorizado.' });
    return;
  }

  try {
    const db = (req as any).db;
    const result = await loginWithCredentials(email, password, db);
    res.status(200).json(result);
  } catch {
    res.status(401).json({ error: 'Credenciais inválidas ou acesso não autorizado.' });
  }
});
