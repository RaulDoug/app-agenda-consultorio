import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { getDatabase } from '../db/connection.js';

export const syncRouter = Router();

syncRouter.use(authMiddleware);

// Sincronização em Lote Offline-First com Last-Write-Wins e Idempotência
syncRouter.post('/batch', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const db = getDatabase();

    const appointments: any[] = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.appointments)
      ? req.body.appointments
      : [];

    const patients: any[] = Array.isArray(req.body?.patients) ? req.body.patients : [];

    let appliedCount = 0;
    let ignoredCount = 0;

    // 1. Sincronização de Pacientes
    for (const patient of patients) {
      if (!patient.id || !patient.name || !patient.whatsapp) continue;

      const existingRes = await db.query(
        `SELECT id, updated_at FROM patients WHERE id = $1 AND tenant_id = $2`,
        [patient.id, tenantId]
      );

      const incomingUpdatedAt = new Date(patient.updated_at || Date.now());

      if (existingRes.rows.length === 0) {
        await db.query(
          `INSERT INTO patients (id, tenant_id, name, whatsapp, notes, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            patient.id,
            tenantId,
            patient.name,
            patient.whatsapp,
            patient.notes || null,
            patient.is_active !== undefined ? patient.is_active : true,
            patient.created_at || new Date().toISOString(),
            incomingUpdatedAt.toISOString(),
          ]
        );
        appliedCount++;
      } else {
        const existingUpdatedAt = new Date(existingRes.rows[0].updated_at || 0);
        if (incomingUpdatedAt.getTime() > existingUpdatedAt.getTime()) {
          await db.query(
            `UPDATE patients
             SET name = $3, whatsapp = $4, notes = $5, is_active = $6, updated_at = $7
             WHERE id = $1 AND tenant_id = $2`,
            [
              patient.id,
              tenantId,
              patient.name,
              patient.whatsapp,
              patient.notes || null,
              patient.is_active !== undefined ? patient.is_active : true,
              incomingUpdatedAt.toISOString(),
            ]
          );
          appliedCount++;
        } else {
          ignoredCount++;
        }
      }
    }

    // 2. Sincronização de Agendamentos
    for (const app of appointments) {
      if (!app.id || !app.patient_id || !app.start_time || !app.end_time) continue;

      const existingRes = await db.query(
        `SELECT id, updated_at FROM appointments WHERE id = $1 AND tenant_id = $2`,
        [app.id, tenantId]
      );

      const incomingUpdatedAt = new Date(app.updated_at || Date.now());

      if (existingRes.rows.length === 0) {
        await db.query(
          `INSERT INTO appointments (
            id, tenant_id, patient_id, start_time, end_time, status,
            is_overtime, total_charged_cents, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            app.id,
            tenantId,
            app.patient_id,
            app.start_time,
            app.end_time,
            app.status || 'PENDING',
            Boolean(app.is_overtime),
            app.total_charged_cents || null,
            app.notes || null,
            app.created_at || new Date().toISOString(),
            incomingUpdatedAt.toISOString(),
          ]
        );

        if (Array.isArray(app.items)) {
          for (const item of app.items) {
            await db.query(
              `INSERT INTO appointment_items (id, appointment_id, procedure_id, effective_price_cents, duration_minutes)
               VALUES ($1, $2, $3, $4, $5)`,
              [
                item.id || crypto.randomUUID(),
                app.id,
                item.procedure_id,
                item.effective_price_cents || 0,
                item.duration_minutes || 30,
              ]
            );
          }
        }
        appliedCount++;
      } else {
        const existingUpdatedAt = new Date(existingRes.rows[0].updated_at || 0);
        if (incomingUpdatedAt.getTime() > existingUpdatedAt.getTime()) {
          await db.query(
            `UPDATE appointments
             SET patient_id = $3, start_time = $4, end_time = $5, status = $6,
                 is_overtime = $7, total_charged_cents = $8, notes = $9, updated_at = $10
             WHERE id = $1 AND tenant_id = $2`,
            [
              app.id,
              tenantId,
              app.patient_id,
              app.start_time,
              app.end_time,
              app.status || 'PENDING',
              Boolean(app.is_overtime),
              app.total_charged_cents || null,
              app.notes || null,
              incomingUpdatedAt.toISOString(),
            ]
          );
          appliedCount++;
        } else {
          ignoredCount++;
        }
      }
    }

    res.json({
      success: true,
      processed: appointments.length + patients.length,
      applied: appliedCount,
      ignored: ignoredCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Sincronização Delta (Pull Sync): Retorna dados criados/atualizados no servidor desde `since`
syncRouter.get('/pull', async (req, res): Promise<void> => {
  try {
    const tenantId = req.tenantId!;
    const db = (req as any).db || getDatabase();
    const sinceParam = req.query.since as string;
    const sinceIso = sinceParam ? new Date(sinceParam).toISOString() : new Date(0).toISOString();

    // 1. Appointments
    const appointmentsRes = await db.query(
      `SELECT * FROM appointments
       WHERE tenant_id = $1 AND (updated_at > $2 OR (updated_at IS NULL AND created_at > $2))
       ORDER BY updated_at ASC`,
      [tenantId, sinceIso]
    );

    // Itens dos appointments
    const itemsRes = await db.query(
      `SELECT ai.* FROM appointment_items ai
       JOIN appointments a ON a.id = ai.appointment_id
       WHERE a.tenant_id = $1 AND (a.updated_at > $2 OR (a.updated_at IS NULL AND a.created_at > $2))`,
      [tenantId, sinceIso]
    );

    const itemsMap: Record<string, any[]> = {};
    for (const item of itemsRes.rows) {
      if (!itemsMap[item.appointment_id]) {
        itemsMap[item.appointment_id] = [];
      }
      itemsMap[item.appointment_id].push(item);
    }

    const appointmentsWithItems = appointmentsRes.rows.map((a: any) => ({
      ...a,
      items: itemsMap[a.id] || [],
    }));

    // 2. Patients
    const patientsRes = await db.query(
      `SELECT * FROM patients
       WHERE tenant_id = $1 AND (updated_at > $2 OR (updated_at IS NULL AND created_at > $2))
       ORDER BY updated_at ASC`,
      [tenantId, sinceIso]
    );

    // 3. Procedures
    const proceduresRes = await db.query(
      `SELECT * FROM procedures
       WHERE tenant_id = $1 AND (updated_at > $2 OR (updated_at IS NULL AND created_at > $2))
       ORDER BY updated_at ASC`,
      [tenantId, sinceIso]
    );

    // 4. Financial Transactions
    const transactionsRes = await db.query(
      `SELECT * FROM financial_transactions
       WHERE tenant_id = $1 AND (updated_at > $2 OR (updated_at IS NULL AND created_at > $2))
       ORDER BY updated_at ASC`,
      [tenantId, sinceIso]
    );

    // 5. Schedule Blocks
    const scheduleBlocksRes = await db.query(
      `SELECT * FROM schedule_blocks
       WHERE tenant_id = $1 AND (updated_at > $2 OR (updated_at IS NULL AND created_at > $2))
       ORDER BY updated_at ASC`,
      [tenantId, sinceIso]
    );

    // 6. Business Hours
    const businessHoursRes = await db.query(
      `SELECT * FROM business_hours
       WHERE tenant_id = $1 AND (updated_at > $2 OR (updated_at IS NULL AND created_at > $2))
       ORDER BY day_of_week ASC`,
      [tenantId, sinceIso]
    );

    res.status(200).json({
      server_timestamp: new Date().toISOString(),
      appointments: appointmentsWithItems,
      patients: patientsRes.rows,
      procedures: proceduresRes.rows,
      financial_transactions: transactionsRes.rows,
      schedule_blocks: scheduleBlocksRes.rows,
      business_hours: businessHoursRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao executar pull sync.', details: err.message });
  }
});

