import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { BusinessHoursRepository } from '../business-hours-repository.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('BusinessHoursRepository — Persistência, Auto-Seed e Upsert (Sem Delete)', () => {
  let db: IDatabase;
  let repo: BusinessHoursRepository;
  let tenantId: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    repo = new BusinessHoursRepository(db);

    const s = await seedTestTenant(db);
    tenantId = s.id;
  });

  it('deve permitir auto-seed dos 7 dias da semana via ensureDefaultHours', async () => {
    await repo.ensureDefaultHours(tenantId);
    const list = await repo.findByTenant(tenantId);

    expect(list).toHaveLength(7);
    expect(list.map(d => d.day_of_week)).toEqual([0, 1, 2, 3, 4, 5, 6]);

    // Domingo fechado
    expect(list[0].is_open).toBe(false);
    // Segunda a Sexta abertos
    expect(list[1].is_open).toBe(true);
    expect(list[1].start_time).toContain('08:00');
    expect(list[1].end_time).toContain('18:00');
    expect(list[1].break_start_time).toContain('12:00');
    expect(list[1].break_end_time).toContain('13:30');
    // Sábado fechado
    expect(list[6].is_open).toBe(false);
  });

  it('deve atualizar o horário de um dia específico via upsertDay', async () => {
    await repo.ensureDefaultHours(tenantId);

    const updated = await repo.upsertDay(tenantId, {
      day_of_week: 6, // Sábado
      is_open: true,
      start_time: '08:00',
      end_time: '12:00',
      break_start_time: null,
      break_end_time: null,
    });

    expect(updated).toBeDefined();
    expect(updated.day_of_week).toBe(6);
    expect(updated.is_open).toBe(true);
    expect(updated.start_time).toContain('08:00');
    expect(updated.end_time).toContain('12:00');
    expect(updated.break_start_time).toBeNull();
  });

  it('deve atualizar múltiplos horários em lote via upsertBatch', async () => {
    await repo.ensureDefaultHours(tenantId);

    const result = await repo.upsertBatch(tenantId, [
      {
        day_of_week: 1,
        is_open: true,
        start_time: '09:00',
        end_time: '19:00',
        break_start_time: '13:00',
        break_end_time: '14:00',
      },
      {
        day_of_week: 5,
        is_open: true,
        start_time: '08:30',
        end_time: '17:30',
        break_start_time: '12:00',
        break_end_time: '13:00',
      },
    ]);

    expect(result).toHaveLength(7);
    const seg = result.find(d => d.day_of_week === 1);
    expect(seg?.start_time).toContain('09:00');
    expect(seg?.end_time).toContain('19:00');
    expect(seg?.break_start_time).toContain('13:00');

    const sex = result.find(d => d.day_of_week === 5);
    expect(sex?.start_time).toContain('08:30');
  });
});
