import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { getDatabase } from '../db/connection.js';

export const syncRouter = Router();

syncRouter.use(authMiddleware);

// Sincronização em Lote Offline-First com Last-Write-Wins e Idempotência
syncRouter.post('/batch', async (req, res) => {
  try {
    const tenantId = req.tenantId!;
    const db = (req as any).db || getDatabase();

    const mutations: any[] = Array.isArray(req.body?.mutations) ? req.body.mutations : [];

    let appointments: any[] = [];
    let patients: any[] = [];
    let financialTransactions: any[] = [];
    let procedures: any[] = [];

    if (mutations.length > 0) {
      for (const m of mutations) {
        if (m.entity === 'appointments' && m.payload) {
          appointments.push({
            ...m.payload,
            operation: m.operation,
            client_mutation_id: m.client_mutation_id,
            updated_at: m.payload.updated_at || m.timestamp || new Date().toISOString(),
          });
        } else if (m.entity === 'patients' && m.payload) {
          patients.push({
            ...m.payload,
            operation: m.operation,
            client_mutation_id: m.client_mutation_id,
            updated_at: m.payload.updated_at || m.timestamp || new Date().toISOString(),
          });
        } else if (m.entity === 'financial_transactions' && m.payload) {
          financialTransactions.push({
            ...m.payload,
            operation: m.operation,
            client_mutation_id: m.client_mutation_id,
            updated_at: m.payload.updated_at || m.timestamp || new Date().toISOString(),
          });
        } else if (m.entity === 'procedures' && m.payload) {
          procedures.push({
            ...m.payload,
            operation: m.operation,
            client_mutation_id: m.client_mutation_id,
            updated_at: m.payload.updated_at || m.timestamp || new Date().toISOString(),
          });
        }
      }
    } else {
      appointments = Array.isArray(req.body)
        ? req.body
        : Array.isArray(req.body?.appointments)
        ? req.body.appointments
        : [];
      patients = Array.isArray(req.body?.patients) ? req.body.patients : [];
      financialTransactions = Array.isArray(req.body?.financial_transactions) ? req.body.financial_transactions : [];
      procedures = Array.isArray(req.body?.procedures) ? req.body.procedures : [];
    }

    let appliedCount = 0;
    let ignoredCount = 0;
    const conflicts: any[] = [];

    // 1. Sincronização de Pacientes
    for (const patient of patients) {
      try {
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
      } catch (patErr: any) {
        console.error('[Sync Batch] Erro ao sincronizar paciente:', patient?.id, patErr);
        ignoredCount++;
        conflicts.push({ id: patient?.id, reason: patErr.message });
      }
    }

    // 2. Sincronização de Agendamentos
    for (const app of appointments) {
      try {
        if (!app.id) continue;

        const isOvertime = Boolean(app.is_overtime ?? app.is_extra_fit);

        // Verificação de choque de horários (Double Booking) se não for encaixe
        if (!isOvertime && app.start_time && app.end_time && app.status !== 'CANCELLED') {
          const overlapRes = await db.query(
            `SELECT id FROM appointments
             WHERE tenant_id = $1 AND id != $2 AND deleted_at IS NULL AND status != 'CANCELLED'
               AND (start_time < $4 AND end_time > $3)
             LIMIT 1`,
            [tenantId, app.id, app.start_time, app.end_time]
          );

          if (overlapRes.rows.length > 0) {
            ignoredCount++;
            conflicts.push({ id: app.id, reason: 'DOUBLE_BOOKING_CONFLICT' });
            continue;
          }
        }

        const existingRes = await db.query(
          `SELECT id, updated_at FROM appointments WHERE id = $1 AND tenant_id = $2`,
          [app.id, tenantId]
        );

        const incomingUpdatedAt = new Date(app.updated_at || Date.now());

        if (existingRes.rows.length === 0) {
          if (!app.patient_id || !app.start_time || !app.end_time) continue;

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
              isOvertime,
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
               SET patient_id = COALESCE($3, patient_id),
                   start_time = COALESCE($4, start_time),
                   end_time = COALESCE($5, end_time),
                   status = COALESCE($6, status),
                   is_overtime = COALESCE($7, is_overtime),
                   total_charged_cents = COALESCE($8, total_charged_cents),
                   notes = COALESCE($9, notes),
                   updated_at = $10
               WHERE id = $1 AND tenant_id = $2`,
              [
                app.id,
                tenantId,
                app.patient_id || null,
                app.start_time || null,
                app.end_time || null,
                app.status || null,
                app.is_overtime !== undefined || app.is_extra_fit !== undefined ? isOvertime : null,
                app.total_charged_cents || null,
                app.notes || null,
                incomingUpdatedAt.toISOString(),
              ]
            );

            if (Array.isArray(app.items) && app.items.length > 0) {
              await db.query(`DELETE FROM appointment_items WHERE appointment_id = $1`, [app.id]);
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
            ignoredCount++;
          }
        }
      } catch (appErr: any) {
        console.error('[Sync Batch] Erro ao sincronizar agendamento:', app?.id, appErr);
        ignoredCount++;
        conflicts.push({ id: app?.id, reason: appErr.message });
      }
    }

    // 3. Sincronização de Transações Financeiras (Offline-First / LWW / Soft Delete)
    for (const tx of financialTransactions) {
      try {
        if (!tx.id) continue;

        const existingRes = await db.query(
          `SELECT id, updated_at, is_active FROM financial_transactions WHERE id = $1 AND tenant_id = $2`,
          [tx.id, tenantId]
        );

        const incomingUpdatedAt = new Date(tx.updated_at || Date.now());
        const isDeleteOp = tx.operation === 'DELETE' || tx.is_active === false;

        // Sanitização de chave estrangeira appointment_id (evita erro de FK se agendamento não existir no banco)
        let appointmentId = tx.appointment_id && typeof tx.appointment_id === 'string' && tx.appointment_id.trim() !== ''
          ? tx.appointment_id.trim()
          : null;
        if (appointmentId) {
          const appCheck = await db.query(
            `SELECT id FROM appointments WHERE id = $1 AND tenant_id = $2`,
            [appointmentId, tenantId]
          );
          if (appCheck.rows.length === 0) {
            appointmentId = null;
          }
        }

        let groupId = tx.group_id && typeof tx.group_id === 'string' && tx.group_id.trim() !== ''
          ? tx.group_id.trim()
          : null;

        const amountCents = Math.max(1, Math.round(Number(tx.amount_cents) || 0));
        const rawDue = tx.due_date || tx.payment_date;
        const dueDate = rawDue ? String(rawDue).slice(0, 10) : new Date().toISOString().slice(0, 10);
        const paymentDate = tx.payment_date ? String(tx.payment_date).slice(0, 10) : (tx.status === 'PAID' ? dueDate : null);
        const category = tx.category ? String(tx.category).slice(0, 100) : 'OUTROS';
        const description = tx.description ? String(tx.description).slice(0, 255) : null;
        const type = tx.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME';
        const status = tx.status === 'PENDING' ? 'PENDING' : 'PAID';
        const paymentMethod = tx.payment_method ? String(tx.payment_method).slice(0, 20) : null;
        const installmentNumber = tx.installment_number ? Math.max(1, Number(tx.installment_number) || 1) : 1;
        const totalInstallments = tx.total_installments ? Math.max(1, Number(tx.total_installments) || 1) : 1;

        if (existingRes.rows.length === 0) {
          const isActive = isDeleteOp ? false : (tx.is_active !== undefined ? tx.is_active : true);
          const deletedAt = isDeleteOp ? (tx.deleted_at || incomingUpdatedAt.toISOString()) : (tx.deleted_at || null);

          await db.query(
            `INSERT INTO financial_transactions (
              id, tenant_id, appointment_id, type, category, description,
              amount_cents, payment_method, status, due_date, payment_date,
              installment_number, total_installments, group_id, is_active,
              deleted_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
              tx.id,
              tenantId,
              appointmentId,
              type,
              category,
              description,
              amountCents,
              paymentMethod,
              status,
              dueDate,
              paymentDate,
              installmentNumber,
              totalInstallments,
              groupId,
              isActive,
              deletedAt,
              tx.created_at || new Date().toISOString(),
              incomingUpdatedAt.toISOString(),
            ]
          );
          appliedCount++;
        } else {
          const existingUpdatedAt = new Date(existingRes.rows[0].updated_at || 0);
          if (incomingUpdatedAt.getTime() > existingUpdatedAt.getTime()) {
            if (isDeleteOp) {
              await db.query(
                `UPDATE financial_transactions
                 SET is_active = false,
                     deleted_at = COALESCE($3::timestamptz, $4::timestamptz),
                     updated_at = $4::timestamptz
                 WHERE id = $1 AND tenant_id = $2`,
                [
                  tx.id,
                  tenantId,
                  tx.deleted_at || null,
                  incomingUpdatedAt.toISOString(),
                ]
              );
            } else {
              const updateAmountCents = tx.amount_cents !== undefined ? Math.max(1, Math.round(Number(tx.amount_cents) || 0)) : null;
              const updateDueDate = tx.due_date ? String(tx.due_date).slice(0, 10) : null;
              const hasPaymentDate = tx.payment_date !== undefined;
              const updatePaymentDate = tx.payment_date ? String(tx.payment_date).slice(0, 10) : null;
              const updateCategory = tx.category !== undefined ? (tx.category ? String(tx.category).slice(0, 100) : 'OUTROS') : null;
              const updateDescription = tx.description !== undefined ? (tx.description ? String(tx.description).slice(0, 255) : null) : null;
              const updateType = tx.type !== undefined ? (tx.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME') : null;
              const updateStatus = tx.status !== undefined ? (tx.status === 'PENDING' ? 'PENDING' : 'PAID') : null;
              const updatePaymentMethod = tx.payment_method !== undefined ? (tx.payment_method ? String(tx.payment_method).slice(0, 20) : null) : null;
              const updateInstallmentNumber = tx.installment_number !== undefined ? Math.max(1, Number(tx.installment_number) || 1) : null;
              const updateTotalInstallments = tx.total_installments !== undefined ? Math.max(1, Number(tx.total_installments) || 1) : null;

              await db.query(
                `UPDATE financial_transactions
                 SET appointment_id = COALESCE($3::uuid, appointment_id),
                     type = COALESCE($4, type),
                     category = COALESCE($5, category),
                     description = CASE WHEN $6 = '__SET_NULL__' THEN NULL WHEN $6 IS NOT NULL THEN $6 ELSE description END,
                     amount_cents = COALESCE($7::integer, amount_cents),
                     payment_method = COALESCE($8, payment_method),
                     status = COALESCE($9, status),
                     due_date = COALESCE($10::date, due_date),
                     payment_date = CASE WHEN $11::boolean THEN $12::date ELSE payment_date END,
                     installment_number = COALESCE($13::integer, installment_number),
                     total_installments = COALESCE($14::integer, total_installments),
                     group_id = COALESCE($15::uuid, group_id),
                     is_active = COALESCE($16::boolean, is_active),
                     deleted_at = COALESCE($17::timestamptz, deleted_at),
                     updated_at = $18::timestamptz
                 WHERE id = $1 AND tenant_id = $2`,
                [
                  tx.id,
                  tenantId,
                  appointmentId,
                  updateType,
                  updateCategory,
                  tx.description === null ? '__SET_NULL__' : (updateDescription || null),
                  updateAmountCents,
                  updatePaymentMethod,
                  updateStatus,
                  updateDueDate,
                  hasPaymentDate,
                  updatePaymentDate,
                  updateInstallmentNumber,
                  updateTotalInstallments,
                  groupId,
                  tx.is_active !== undefined ? tx.is_active : null,
                  tx.deleted_at || null,
                  incomingUpdatedAt.toISOString(),
                ]
              );
            }
            appliedCount++;
          } else {
            ignoredCount++;
          }
        }
      } catch (txErr: any) {
        console.error('[Sync Batch] Erro ao sincronizar transação:', tx?.id, txErr);
        ignoredCount++;
        conflicts.push({ id: tx?.id, reason: txErr.message });
      }
    }

    // 4. Sincronização de Procedimentos (Offline-First / LWW / Soft Delete)
    for (const proc of procedures) {
      try {
        if (!proc.id || !proc.name) continue;

        const existingRes = await db.query(
          `SELECT id, updated_at FROM procedures WHERE id = $1 AND tenant_id = $2`,
          [proc.id, tenantId]
        );

        const incomingUpdatedAt = new Date(proc.updated_at || Date.now());
        const isDeleteOp = proc.operation === 'DELETE' || proc.is_active === false;

        const durationMinutes = Math.max(1, Number(proc.default_duration_minutes) || 30);
        const defaultPrice = Math.max(0, Math.round(Number(proc.default_price_cents) || 0));
        const costPrice = Math.max(0, Math.round(Number(proc.cost_cents) || 0));

        if (existingRes.rows.length === 0) {
          await db.query(
            `INSERT INTO procedures (
              id, tenant_id, name, default_duration_minutes, default_price_cents,
              cost_cents, is_active, deleted_at, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              proc.id,
              tenantId,
              proc.name,
              durationMinutes,
              defaultPrice,
              costPrice,
              isDeleteOp ? false : (proc.is_active !== undefined ? proc.is_active : true),
              isDeleteOp ? (proc.deleted_at || incomingUpdatedAt.toISOString()) : (proc.deleted_at || null),
              proc.created_at || new Date().toISOString(),
              incomingUpdatedAt.toISOString(),
            ]
          );
          appliedCount++;
        } else {
          const existingUpdatedAt = new Date(existingRes.rows[0].updated_at || 0);
          if (incomingUpdatedAt.getTime() > existingUpdatedAt.getTime()) {
            await db.query(
              `UPDATE procedures
               SET name = COALESCE($3, name),
                   default_duration_minutes = COALESCE($4, default_duration_minutes),
                   default_price_cents = COALESCE($5, default_price_cents),
                   cost_cents = COALESCE($6, cost_cents),
                   is_active = COALESCE($7, is_active),
                   deleted_at = COALESCE($8, deleted_at),
                   updated_at = $9
               WHERE id = $1 AND tenant_id = $2`,
              [
                proc.id,
                tenantId,
                proc.name || null,
                durationMinutes,
                defaultPrice,
                costPrice,
                proc.is_active !== undefined ? proc.is_active : (isDeleteOp ? false : null),
                proc.deleted_at !== undefined ? proc.deleted_at : (isDeleteOp ? incomingUpdatedAt.toISOString() : null),
                incomingUpdatedAt.toISOString(),
              ]
            );
            appliedCount++;
          } else {
            ignoredCount++;
          }
        }
      } catch (procErr: any) {
        console.error('[Sync Batch] Erro ao sincronizar procedimento:', proc?.id, procErr);
        ignoredCount++;
        conflicts.push({ id: proc?.id, reason: procErr.message });
      }
    }

    res.json({
      success: true,
      processed: appointments.length + patients.length + financialTransactions.length + procedures.length,
      applied: appliedCount,
      ignored: ignoredCount,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    });
  } catch (err: any) {
    console.error('[Sync Batch 500 Fatal Error]:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
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

    const transactionsClean = transactionsRes.rows.map((tx: any) => ({
      ...tx,
      due_date: tx.due_date
        ? (tx.due_date instanceof Date ? tx.due_date.toISOString().slice(0, 10) : String(tx.due_date).slice(0, 10))
        : null,
      payment_date: tx.payment_date
        ? (tx.payment_date instanceof Date ? tx.payment_date.toISOString().slice(0, 10) : String(tx.payment_date).slice(0, 10))
        : null,
    }));

    res.status(200).json({
      server_timestamp: new Date().toISOString(),
      appointments: appointmentsWithItems,
      patients: patientsRes.rows,
      procedures: proceduresRes.rows,
      financial_transactions: transactionsClean,
      schedule_blocks: scheduleBlocksRes.rows,
      business_hours: businessHoursRes.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao executar pull sync.', details: err.message });
  }
});

