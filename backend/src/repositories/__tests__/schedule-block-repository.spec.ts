import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { ScheduleBlockRepository } from '../schedule-block-repository.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('ScheduleBlockRepository — Persistência, Conflitos de Sobreposição e Soft-Delete', () => {
  let db: IDatabase;
  let repo: ScheduleBlockRepository;
  let tenantA: string;
  let tenantB: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    repo = new ScheduleBlockRepository(db);

    const sA = await seedTestTenant(db);
    tenantA = sA.id;
    const sB = await seedTestTenant(db);
    tenantB = sB.id;
  });

  it('deve criar um bloqueio de agenda com sucesso', async () => {
    const block = await repo.create(tenantA, {
      title: 'Reforma do Consultório 2',
      start_time: '2026-11-01T08:00:00.000Z',
      end_time: '2026-11-01T12:00:00.000Z',
    });

    expect(block).toBeDefined();
    expect(block.id).toBeDefined();
    expect(block.title).toBe('Reforma do Consultório 2');
    expect(block.start_time).toBeDefined();
    expect(block.end_time).toBeDefined();
  });

  it('deve buscar bloqueio por ID respeitando multi-tenant', async () => {
    const createdA = await repo.create(tenantA, {
      title: 'Congresso de Odontologia',
      start_time: '2026-11-05T09:00:00.000Z',
      end_time: '2026-11-05T18:00:00.000Z',
    });

    const foundA = await repo.findById(tenantA, createdA.id);
    expect(foundA).not.toBeNull();
    expect(foundA?.title).toBe('Congresso de Odontologia');

    const foundB = await repo.findById(tenantB, createdA.id);
    expect(foundB).toBeNull();
  });

  it('deve detectar bloqueios sobrepostos via findOverlapping', async () => {
    await repo.create(tenantA, {
      title: 'Reunião Clínica Matinal',
      start_time: '2026-11-10T08:00:00.000Z',
      end_time: '2026-11-10T10:00:00.000Z',
    });

    // Caso 1: Intervalo que intercepta (09:00 às 09:30)
    const overlaps1 = await repo.findOverlapping(
      tenantA,
      '2026-11-10T09:00:00.000Z',
      '2026-11-10T09:30:00.000Z'
    );
    expect(overlaps1).toHaveLength(1);
    expect(overlaps1[0].title).toBe('Reunião Clínica Matinal');

    // Caso 2: Intervalo após o bloqueio (10:00 às 11:00)
    const overlaps2 = await repo.findOverlapping(
      tenantA,
      '2026-11-10T10:00:00.000Z',
      '2026-11-10T11:00:00.000Z'
    );
    expect(overlaps2).toHaveLength(0);
  });

  it('deve atualizar bloqueio com sucesso', async () => {
    const created = await repo.create(tenantA, {
      title: 'Bloqueio Original',
      start_time: '2026-11-12T14:00:00.000Z',
      end_time: '2026-11-12T15:00:00.000Z',
    });

    const updated = await repo.update(tenantA, created.id, {
      title: 'Bloqueio Estendido',
      end_time: '2026-11-12T16:00:00.000Z',
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe('Bloqueio Estendido');
  });

  it('deve realizar soft-delete de bloqueio de agenda', async () => {
    const created = await repo.create(tenantA, {
      title: 'Bloqueio Cancelado',
      start_time: '2026-11-15T10:00:00.000Z',
      end_time: '2026-11-15T11:00:00.000Z',
    });

    const deleted = await repo.softDelete(tenantA, created.id);
    expect(deleted).toBe(true);

    const found = await repo.findById(tenantA, created.id);
    expect(found).toBeNull();
  });
});
