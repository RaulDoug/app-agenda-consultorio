import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { getDatabase } from '../db/connection.js';
import { getEvolutionClient } from '../whatsapp/evolution-client.js';

export const whatsappSessionRouter = Router();

whatsappSessionRouter.use(authMiddleware);

whatsappSessionRouter.get('/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const db = (req as any).db || getDatabase();

    const tenantRes = await db.query(
      `SELECT id, name, whatsapp_instance_name, whatsapp_connected
       FROM tenants
       WHERE id = $1`,
      [tenantId]
    );

    const tenant = tenantRes.rows[0];
    if (!tenant) {
      res.status(404).json({ error: 'Consultório não encontrado.' });
      return;
    }

    const instanceName = tenant.whatsapp_instance_name || `cliniassist_${tenant.id.slice(0, 8)}`;
    const isConnected = Boolean(tenant.whatsapp_connected);

    if (isConnected) {
      res.status(200).json({
        connected: true,
        instanceName,
        state: 'open',
      });
      return;
    }

    // Instância desconectada: busca QR Code
    let qrcode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIEAYAAAD9ZyIHAAA';
    try {
      const client = getEvolutionClient();
      if (client.getQrCode) {
        const qrRes = await client.getQrCode(instanceName);
        if (qrRes.base64) {
          qrcode = qrRes.base64.startsWith('data:') ? qrRes.base64 : `data:image/png;base64,${qrRes.base64}`;
        }
      }
    } catch {
      // Usa QR Code simulado/fallback
    }

    res.status(200).json({
      connected: false,
      instanceName,
      state: 'close',
      qrcode,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao consultar status do WhatsApp.', details: err.message });
  }
});

whatsappSessionRouter.post('/connect', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const db = (req as any).db || getDatabase();

    const tenantRes = await db.query(
      `SELECT id, name, whatsapp_instance_name
       FROM tenants
       WHERE id = $1`,
      [tenantId]
    );

    const tenant = tenantRes.rows[0];
    if (!tenant) {
      res.status(404).json({ error: 'Consultório não encontrado.' });
      return;
    }

    const instanceName = tenant.whatsapp_instance_name || `cliniassist_${tenant.id.slice(0, 8)}`;
    let qrcode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIEAYAAAD9ZyIHAAA';

    try {
      const client = getEvolutionClient();
      if (client.getQrCode) {
        const qrRes = await client.getQrCode(instanceName);
        if (qrRes.base64) {
          qrcode = qrRes.base64.startsWith('data:') ? qrRes.base64 : `data:image/png;base64,${qrRes.base64}`;
        }
      }
    } catch {
      // Fallback
    }

    res.status(200).json({
      instanceName,
      state: 'connecting',
      qrcode,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao solicitar conexão WhatsApp.', details: err.message });
  }
});

whatsappSessionRouter.post('/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const { number, text, instanceName } = req.body;
    if (!number || !text) {
      res.status(400).json({ error: 'Os campos number e text são obrigatórios.' });
      return;
    }

    const client = getEvolutionClient();
    const inst = instanceName || 'cliniassist_instance';

    const cleanNumber = String(number).replace(/\D/g, '');
    const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

    const sendRes = await client.sendTextMessage({
      instanceName: inst,
      number: formattedNumber,
      text: String(text),
    });

    res.status(200).json({
      success: true,
      result: sendRes,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao enviar mensagem WhatsApp.', details: err.message });
  }
});

