import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { getDatabase } from '../db/connection.js';
import { getEvolutionClient } from '../whatsapp/evolution-client.js';

export const whatsappSessionRouter = Router();

whatsappSessionRouter.use(authMiddleware);

whatsappSessionRouter.get('/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawTenantId = req.tenantId!;
    const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;
    const db = (req as any).db || getDatabase();

    let tenantRes = await db.query(
      `SELECT id, name, whatsapp_instance_name, whatsapp_connected
       FROM tenants
       WHERE id = $1`,
      [tenantId]
    );

    let tenant = tenantRes.rows[0];
    if (!tenant) {
      try {
        const insertRes = await db.query(
          `INSERT INTO tenants (id, name, whatsapp_instance_name, whatsapp_connected)
           VALUES ($1, 'Consultório CliniAssist', 'cliniassist_default', false)
           RETURNING id, name, whatsapp_instance_name, whatsapp_connected`,
          [tenantId]
        );
        tenant = insertRes.rows[0];
      } catch {
        res.status(404).json({ error: 'Consultório não encontrado.' });
        return;
      }
    }

    const instanceName = tenant.whatsapp_instance_name || `cliniassist_${String(tenant.id).slice(0, 8)}`;

    if (tenant.whatsapp_connected) {
      res.status(200).json({
        connected: true,
        instanceName,
        state: 'open',
      });
      return;
    }

    // Se no banco está false, verifica rapidamente na Evolution API caso tenha conectado recentemente
    const client = getEvolutionClient();
    try {
      const conn = await Promise.race([
        client.getConnectionState(instanceName),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 800)),
      ]);
      if (conn && conn.state === 'open') {
        await db.query(`UPDATE tenants SET whatsapp_connected = true WHERE id = $1`, [tenant.id]);
        res.status(200).json({
          connected: true,
          instanceName,
          state: 'open',
        });
        return;
      }
    } catch {
      // Ignora timeout ou falha
    }

    // Instância desconectada: busca QR Code real ou auto-cria
    let qrcode: string | null = null;
    try {
      if (client.getQrCode) {
        const qrRes = await client.getQrCode(instanceName);
        if (qrRes && qrRes.base64) {
          qrcode = qrRes.base64.startsWith('data:') ? qrRes.base64 : `data:image/png;base64,${qrRes.base64}`;
        }
      }
    } catch {
      // Em geração ou indisponível: mantém null para indicar carregamento no frontend
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
    const rawTenantId = req.tenantId!;
    const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;
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

    const instanceName = tenant.whatsapp_instance_name || `cliniassist_${String(tenant.id).slice(0, 8)}`;
    let qrcode: string | null = null;
    try {
      const client = getEvolutionClient();
      if (client.getQrCode) {
        const qrRes = await client.getQrCode(instanceName);
        if (qrRes && qrRes.base64) {
          qrcode = qrRes.base64.startsWith('data:') ? qrRes.base64 : `data:image/png;base64,${qrRes.base64}`;
        }
      }
    } catch {
      // Mantém null se ainda não gerou QR code
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

whatsappSessionRouter.post('/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawTenantId = req.tenantId!;
    const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;
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

    const instanceName = tenant.whatsapp_instance_name || `cliniassist_${String(tenant.id).slice(0, 8)}`;
    const client = getEvolutionClient();

    if (client.logoutInstance) {
      try {
        await client.logoutInstance(instanceName);
      } catch {
        // Ignora erro se já estava deslogado
      }
    }

    await db.query(
      `UPDATE tenants SET whatsapp_connected = false WHERE id = $1`,
      [tenant.id]
    );

    res.status(200).json({
      success: true,
      connected: false,
      message: 'WhatsApp desconectado com sucesso.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao desconectar WhatsApp.', details: err.message });
  }
});

whatsappSessionRouter.post('/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const { number, text, instanceName } = req.body;
    if (!number || !text) {
      res.status(400).json({ error: 'Os campos number e text são obrigatórios.' });
      return;
    }

    const rawTenantId = req.tenantId!;
    const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;
    const db = (req as any).db || getDatabase();

    let resolvedInstance = instanceName;
    if (!resolvedInstance) {
      try {
        const tenantRes = await db.query(
          `SELECT whatsapp_instance_name FROM tenants WHERE id = $1`,
          [tenantId]
        );
        resolvedInstance = tenantRes.rows[0]?.whatsapp_instance_name;
      } catch {
        // Fallback
      }
    }
    const inst = resolvedInstance || 'cliniassist_default';

    const client = getEvolutionClient();

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

