import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryDatabase, type IDatabase } from '../../db/connection.js';
import { PatientRepository } from '../patient-repository.js';
import { seedTestTenant } from '../../test-utils/auth.js';

describe('PatientRepository — Persistência, Isolamento Multi-Tenant e Soft-Delete', () => {
  let db: IDatabase;
  let repo: PatientRepository;
  let tenantA: string;
  let tenantB: string;

  beforeEach(async () => {
    db = createInMemoryDatabase();
    repo = new PatientRepository(db);

    const sA = await seedTestTenant(db);
    tenantA = sA.id;
    const sB = await seedTestTenant(db);
    tenantB = sB.id;
  });

  it('deve criar um paciente com sucesso e vincular ao tenant correto', async () => {
    const patient = await repo.create(tenantA, {
      name: 'João da Silva',
      whatsapp: '11999998888',
      notes: 'Paciente alérgico a dipirona',
    });

    expect(patient).toBeDefined();
    expect(patient.tenant_id).toBe(tenantA);
    expect(patient.id).toBeDefined();
    expect(patient.name).toBe('João da Silva');
    expect(patient.whatsapp).toBe('11999998888');
    expect(patient.notes).toBe('Paciente alérgico a dipirona');
    expect(patient.is_active).toBe(true);
  });

  it('deve buscar paciente por ID com estrito isolamento multi-tenant', async () => {
    const createdA = await repo.create(tenantA, {
      name: 'Maria Souza',
      whatsapp: '11988887777',
    });

    const foundA = await repo.findById(tenantA, createdA.id);
    expect(foundA).not.toBeNull();
    expect(foundA?.id).toBe(createdA.id);

    // Tentativa de acesso por outro tenant deve retornar null (IDOR protection)
    const foundB = await repo.findById(tenantB, createdA.id);
    expect(foundB).toBeNull();
  });

  it('deve listar pacientes filtrando por busca textual de nome ou whatsapp', async () => {
    await repo.create(tenantA, { name: 'Carlos Eduardo', whatsapp: '11911112222' });
    await repo.create(tenantA, { name: 'Ana Carolina', whatsapp: '11933334444' });
    await repo.create(tenantA, { name: 'Roberto Carlos', whatsapp: '11955556666' });
    // Registro do tenant B não deve vazar
    await repo.create(tenantB, { name: 'Carlos Outro', whatsapp: '11977778888' });

    const searchNome = await repo.findAll(tenantA, { search: 'Carlos' });
    expect(searchNome).toHaveLength(2);
    expect(searchNome.map(p => p.name)).toEqual(['Carlos Eduardo', 'Roberto Carlos']);

    const searchTel = await repo.findAll(tenantA, { search: '3333' });
    expect(searchTel).toHaveLength(1);
    expect(searchTel[0].name).toBe('Ana Carolina');
  });

  it('deve atualizar dados do paciente com sucesso', async () => {
    const created = await repo.create(tenantA, {
      name: 'Beatriz Lima',
      whatsapp: '11900001111',
    });

    const updated = await repo.update(tenantA, created.id, {
      name: 'Beatriz Lima Santos',
      notes: 'Tratamento de canal iniciado',
    });

    expect(updated).not.toBeNull();
    expect(updated?.name).toBe('Beatriz Lima Santos');
    expect(updated?.notes).toBe('Tratamento de canal iniciado');

    // Tenant B não pode atualizar paciente do Tenant A
    const attemptB = await repo.update(tenantB, created.id, { name: 'Hacked' });
    expect(attemptB).toBeNull();
  });

  it('deve realizar soft-delete sem exclusão física do banco', async () => {
    const created = await repo.create(tenantA, {
      name: 'Lucas Ferreira',
      whatsapp: '11922223333',
    });

    const deleted = await repo.softDelete(tenantA, created.id);
    expect(deleted).toBe(true);

    // Consulta padrão por ID não deve retornar registro excluído logicamente
    const found = await repo.findById(tenantA, created.id);
    expect(found).toBeNull();

    // Listagem padrão não deve listar registro excluído logicamente
    const list = await repo.findAll(tenantA);
    expect(list.some(p => p.id === created.id)).toBe(false);

    // Registro deve continuar fisicamente na tabela com deleted_at preenchido
    const rawRes = await db.query('SELECT is_active, deleted_at FROM patients WHERE id = $1', [created.id]);
    expect(rawRes.rows[0].is_active).toBe(false);
    expect(rawRes.rows[0].deleted_at).not.toBeNull();
  });

  it('AC-249: Consulta de inativos e restauração de clientes soft-deleted na API @spec:AC-249', async () => {
    const created = await repo.create(tenantA, {
      name: 'Renata Vasconcelos',
      whatsapp: '11944445555',
      notes: 'Paciente para teste de reativação',
    });

    // Desativa o paciente
    await repo.softDelete(tenantA, created.id);

    // Listagem padrão não inclui inativo
    const activeList = await repo.findAll(tenantA);
    expect(activeList.some(p => p.id === created.id)).toBe(false);

    // Listagem com includeInactive: true inclui o paciente
    const allList = await repo.findAll(tenantA, { includeInactive: true });
    expect(allList.some(p => p.id === created.id)).toBe(true);

    // Reativação do paciente via update
    const reactivated = await repo.update(tenantA, created.id, { is_active: true });
    expect(reactivated).not.toBeNull();
    expect(reactivated?.is_active).toBe(true);
    expect(reactivated?.deleted_at).toBeNull();

    // Agora deve aparecer na listagem ativa normal
    const finalActiveList = await repo.findAll(tenantA);
    expect(finalActiveList.some(p => p.id === created.id)).toBe(true);
  });
});
