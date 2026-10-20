import type { Request, Response } from 'express';
import { WhatsappService } from '../services/whatsapp-service.js';
import { WhatsappSchedulerService } from '../services/whatsapp-scheduler-service.js';

export class WhatsappController {
  constructor(
    private whatsappService: WhatsappService = new WhatsappService(),
    private schedulerService: WhatsappSchedulerService = new WhatsappSchedulerService()
  ) {}

  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const rawTenantId = req.tenantId!;
      const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;

      const session = await this.whatsappService.getSession(tenantId);
      res.status(200).json(session);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar status do WhatsApp.', details: err.message });
    }
  }

  async connect(req: Request, res: Response): Promise<void> {
    try {
      const rawTenantId = req.tenantId!;
      const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;

      const session = await this.whatsappService.connect(tenantId);
      res.status(200).json(session);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao solicitar conexão WhatsApp.', details: err.message });
    }
  }

  async disconnect(req: Request, res: Response): Promise<void> {
    try {
      const rawTenantId = req.tenantId!;
      const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;

      const result = await this.whatsappService.disconnect(tenantId);
      res.status(200).json({
        ...result,
        message: 'WhatsApp desconectado com sucesso.',
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao desconectar WhatsApp.', details: err.message });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const rawTenantId = req.tenantId!;
      const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;

      const { number, text, appointmentId, patientId, instanceName } = req.body || {};
      if (!number || !text) {
        res.status(400).json({ error: 'Os campos number e text são obrigatórios.' });
        return;
      }

      const result = await this.whatsappService.sendMessage(tenantId, {
        number,
        text,
        appointmentId,
        patientId,
        instanceName,
      });

      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao enviar mensagem WhatsApp.', details: err.message });
    }
  }

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const rawTenantId = req.tenantId!;
      const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;

      const settings = await this.whatsappService.getSettings(tenantId);
      res.status(200).json(settings);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao buscar configurações de WhatsApp.', details: err.message });
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const rawTenantId = req.tenantId!;
      const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;

      const updated = await this.whatsappService.updateSettings(tenantId, req.body || {});
      res.status(200).json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao atualizar configurações de WhatsApp.', details: err.message });
    }
  }

  async triggerBatch(req: Request, res: Response): Promise<void> {
    try {
      const rawTenantId = req.tenantId!;
      const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;

      const { force } = req.body || {};
      const result = await this.schedulerService.scheduleBatchForTenant(tenantId, {
        force: Boolean(force),
      });

      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao disparar lote de confirmações.', details: err.message });
    }
  }

  async listMessages(req: Request, res: Response): Promise<void> {
    try {
      const rawTenantId = req.tenantId!;
      const tenantId = rawTenantId === 'tenant-default' ? '11111111-1111-1111-1111-111111111111' : rawTenantId;

      const { appointmentId, patientId, limit } = req.query;

      const messages = await this.whatsappService.listMessages(tenantId, {
        appointmentId: appointmentId as string | undefined,
        patientId: patientId as string | undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json(messages);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao consultar mensagens de WhatsApp.', details: err.message });
    }
  }
}
