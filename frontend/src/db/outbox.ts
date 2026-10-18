import type { CliniAssistLocalDB } from './local-db.js';
import type { OutboxEntity, OutboxOperation, SyncOutboxItem } from './types.js';

export interface EnqueueMutationParams {
  entity: OutboxEntity;
  recordId: string;
  operation: OutboxOperation;
  payload: any;
  clientMutationId?: string;
}

/**
 * Enfileira uma mutação na sync_outbox (deve ser chamado dentro de uma transação Dexie com a tabela destino)
 */
export async function enqueueMutation(
  db: CliniAssistLocalDB,
  params: EnqueueMutationParams
): Promise<SyncOutboxItem> {
  const item: SyncOutboxItem = {
    id: crypto.randomUUID(),
    client_mutation_id: params.clientMutationId || crypto.randomUUID(),
    entity: params.entity,
    record_id: params.recordId,
    operation: params.operation,
    payload: params.payload,
    status: 'PENDING',
    retry_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.sync_outbox.add(item);
  return item;
}

/**
 * Retorna todos os itens pendentes na outbox ordenados cronologicamente
 */
export async function getPendingOutboxItems(db: CliniAssistLocalDB): Promise<SyncOutboxItem[]> {
  return await db.sync_outbox.where('status').equals('PENDING').sortBy('created_at');
}
