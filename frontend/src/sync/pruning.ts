import { CliniAssistLocalDB, localDb } from '../db/local-db.js';

export interface PruneResult {
  prunedAppointmentsCount: number;
  prunedItemsCount: number;
}

/**
 * Poda (Pruning) de histórico local antigo:
 * Remove do IndexedDB agendamentos concluídos ou cancelados há mais de 90 dias,
 * mantendo apenas dados sincronizados e preservando os registros intactos no servidor.
 */
export async function pruneOldCompletedAppointments(
  db: CliniAssistLocalDB = localDb,
  daysOld = 90
): Promise<PruneResult> {
  const cutoffTime = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  // 1. Busca IDs com mutações ainda pendentes na outbox para NÃO podar o que não sincronizou
  const pendingOutbox = await db.sync_outbox
    .where('status')
    .equals('PENDING')
    .filter((o) => o.entity === 'appointments')
    .toArray();
  const pendingIds = new Set(pendingOutbox.map((o) => o.record_id));

  // 2. Localiza agendamentos elegíveis (concluídos ou cancelados e anteriores ao cutoff)
  const candidates = await db.appointments
    .filter(
      (a) =>
        (a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'NO_SHOW') &&
        a.end_time < cutoffTime &&
        !pendingIds.has(a.id)
    )
    .toArray();

  if (candidates.length === 0) {
    return { prunedAppointmentsCount: 0, prunedItemsCount: 0 };
  }

  const candidateIds = candidates.map((c) => c.id);

  // 3. Remove os agendamentos e itens associados atomicamente
  let prunedItemsCount = 0;
  await db.transaction('rw', [db.appointments, db.appointment_items], async () => {
    for (const id of candidateIds) {
      const items = await db.appointment_items.where('appointment_id').equals(id).toArray();
      prunedItemsCount += items.length;
      await db.appointment_items.where('appointment_id').equals(id).delete();
      await db.appointments.delete(id);
    }
  });

  return {
    prunedAppointmentsCount: candidateIds.length,
    prunedItemsCount,
  };
}
