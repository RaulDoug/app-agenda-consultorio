import { Router } from 'express';
import { getDatabase } from '../db/connection.js';
import { getConfirmationQueue } from '../whatsapp/queue.js';
import { handleConnectionRestored } from '../whatsapp/scheduler.js';
import { parsePatientMessage, resolveStatusTransition } from '../whatsapp/parser.js';
import { getEvolutionClient } from '../whatsapp/evolution-client.js';
import { buildConfirmationReply, buildRescheduleReply } from '../whatsapp/reply-templates.js';

export const webhooksRouter = Router();

/**
 * Endpoint de Webhook da Evolution API para recepção de mensagens e eventos de instância
 * POST /api/webhooks/whatsapp
 */
webhooksRouter.post(['/whatsapp', '/whatsapp/:event', '/whatsapp/:event/:sub'], async (req, res) => {
  try {
    const payload = req.body;
    const db = getDatabase();
    const queue = getConfirmationQueue();

    const rawUrlEvent = (req.params as any)?.event;
    const normalizedUrlEvent = rawUrlEvent ? rawUrlEvent.replace(/-/g, '_').toUpperCase() : null;
    const event = payload?.event || payload?.type || normalizedUrlEvent;
    const instanceName = payload?.instance || payload?.instanceName || payload?.sender;

    // 1. Eventos de Conexão e Sessão da Instância
    if (event === 'connection.update' || event === 'CONNECTION_UPDATE' || payload?.state) {
      const state = (payload?.data?.state || payload?.state || '').toLowerCase();
      const statusReason = String(payload?.data?.statusReason || payload?.statusReason || '');

      const isDisconnection = state === 'close' ||
        statusReason.includes('CONNECTION_LOST') ||
        statusReason.includes('DISCONNECTED') ||
        payload?.data?.connection === 'close';

      const isReconnection = state === 'open' ||
        payload?.data?.connection === 'open' ||
        statusReason.includes('CONNECTION_ESTABLISHED');

      if (isDisconnection) {
        if (instanceName) {
          await db.query(
            `UPDATE tenants SET whatsapp_connected = false WHERE whatsapp_instance_name = $1`,
            [instanceName]
          );
        }
        await queue.pause();
        res.status(200).json({
          status: 'connection_lost',
          whatsapp_connected: false,
          queue_paused: true,
        });
        return;
      }

      if (isReconnection) {
        if (instanceName) {
          await db.query(
            `UPDATE tenants SET whatsapp_connected = true WHERE whatsapp_instance_name = $1`,
            [instanceName]
          );
        }
        const reconResult = await handleConnectionRestored(queue);
        res.status(200).json({
          status: 'connection_restored',
          whatsapp_connected: true,
          queue_resumed: reconResult.resumed,
          reconnection_result: reconResult,
        });
        return;
      }

      res.status(200).json({ status: 'ignored_connection_event' });
      return;
    }

    // 2. Eventos de Mensagem Recebida (messages.upsert)
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT' || payload?.data?.message) {
      const data = payload?.data || payload;
      const key = data?.key || {};

      // Ignora mensagens enviadas pelo próprio consultório (fromMe)
      if (key?.fromMe) {
        res.status(200).json({ status: 'ignored_from_me' });
        return;
      }

      // Extrai número do remetente (removendo @s.whatsapp.net)
      const remoteJid = key?.remoteJid || data?.remoteJid || '';
      const rawNumber = remoteJid.replace(/@.*$/, '').replace(/\D/g, '');

      if (!rawNumber) {
        res.status(200).json({ status: 'ignored_no_phone' });
        return;
      }

      // Extrai corpo da mensagem ou tipo de mídia
      const messageContent = data?.message || {};
      const isAudio = Boolean(messageContent.audioMessage || data?.messageType === 'audioMessage');
      const text = messageContent.conversation ||
        messageContent.extendedTextMessage?.text ||
        messageContent.imageMessage?.caption ||
        data?.text ||
        '';

      const parseResult = parsePatientMessage({
        text,
        messageType: isAudio ? 'audio' : 'text',
        mediaUrl: messageContent.audioMessage?.url || null,
        rawPayload: payload,
      });

      // Localiza o consultório (tenant) pela instância da Evolution
      let tenantId: string | null = null;
      if (instanceName) {
        const tenantRes = await db.query(
          `SELECT id FROM tenants WHERE whatsapp_instance_name = $1 AND is_active = true`,
          [instanceName]
        );
        if (tenantRes.rows.length > 0) {
          tenantId = tenantRes.rows[0].id;
        }
      }

      // Busca paciente pelo telefone (tratando número desconhecido de forma limpa - AC-025)
      let patientQuery = `
        SELECT id, tenant_id, name FROM patients
        WHERE (whatsapp = $1 OR whatsapp LIKE $2) AND deleted_at IS NULL
      `;
      const params: any[] = [rawNumber, `%${rawNumber.slice(-8)}`];

      if (tenantId) {
        params.push(tenantId);
        patientQuery += ` AND tenant_id = $${params.length}`;
      }

      const patientRes = await db.query(patientQuery, params);

      if (patientRes.rows.length === 0) {
        // AC-025: Número desconhecido -> Retorna 200 OK silenciosamente sem erro
        res.status(200).json({
          status: 'ignored_unknown_number',
          phone: rawNumber,
          message: 'Mensagem recebida de número não cadastrado. Ignorado com sucesso.',
        });
        return;
      }

      const patient = patientRes.rows[0];
      const activeTenantId = tenantId || patient.tenant_id;

      // Busca agendamento mais relevante para o paciente (PENDING, CONFIRMED ou MESSAGE_RECEIVED)
      const appQuery = `
        SELECT id, tenant_id, patient_id, status, start_time
        FROM appointments
        WHERE tenant_id = $1 AND patient_id = $2 AND deleted_at IS NULL
          AND status IN ('PENDING', 'CONFIRMED', 'MESSAGE_RECEIVED')
        ORDER BY start_time ASC
        LIMIT 1
      `;
      const appRes = await db.query(appQuery, [activeTenantId, patient.id]);

      if (appRes.rows.length === 0) {
        res.status(200).json({
          status: 'ignored_no_active_appointment',
          patient_id: patient.id,
          phone: rawNumber,
        });
        return;
      }

      const appointment = appRes.rows[0];

      // Resolve a transição de status (incluindo quando paciente muda de ideia - AC-020)
      const transition = resolveStatusTransition(appointment.status, parseResult.classification);

      // Atualiza o agendamento no PostgreSQL
      await db.query(
        `UPDATE appointments
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND tenant_id = $3`,
        [transition.newStatus, appointment.id, activeTenantId]
      );

      // Dispara réplica humanizada de feedback ao paciente (AC-086, AC-087, AC-088)
      let replyText: string | null = null;
      if (parseResult.classification === 'CONFIRMED') {
        replyText = buildConfirmationReply(patient.name, appointment.start_time);
      } else if (parseResult.classification === 'RESCHEDULE_REQUESTED') {
        replyText = buildRescheduleReply(patient.name);
      }

      let replySent = false;
      if (replyText) {
        try {
          const client = getEvolutionClient();
          const targetInstance = instanceName || 'cliniassist_default';
          await client.sendTextMessage({
            instanceName: targetInstance,
            number: rawNumber,
            text: replyText,
          });
          replySent = true;
        } catch (err: any) {
          // AC-088: Falhas no envio da réplica não prejudicam a persistência da consulta
          console.warn('[Webhook] Falha ao enviar réplica automática ao paciente:', err.message);
        }
      }

      res.status(200).json({
        status: 'processed',
        appointment_id: appointment.id,
        patient_id: patient.id,
        new_status: transition.newStatus,
        changed_mind: transition.changedMind,
        requires_attention: transition.requiresAttention,
        classification: parseResult.classification,
        reply_sent: replySent,
      });
      return;
    }

    // Demais eventos não monitorados respondem 200 OK
    res.status(200).json({ status: 'ignored_unhandled_event', event });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
