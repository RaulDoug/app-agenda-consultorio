/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../../local-db.js';
import { PatientLocalRepository } from '../patient-local-repository.js';

describe('PatientLocalRepository — Unicidade de WhatsApp e Soft-Delete', () => {
  let db: CliniAssistLocalDB;
  let repo: PatientLocalRepository;
  const tenantId = 'tenant-pat-test-1';

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test_pat_${Date.now()}_${Math.random()}`);
    await db.open();
    repo = new PatientLocalRepository(db);
  });

  it('AC-201: Prevenção de duplicidade de pacientes com e sem DDI 55 @spec:AC-201', async () => {
    // 1. Cadastra o primeiro paciente com WhatsApp nacional sem DDI 55
    await repo.createPatient({
      tenant_id: tenantId,
      name: 'Mariana Nacional',
      whatsapp: '3798231077',
    });

    // 2. Tenta cadastrar um segundo paciente informando o mesmo número com prefixo 55
    await expect(
      repo.createPatient({
        tenant_id: tenantId,
        name: 'Mariana Internacional',
        whatsapp: '553798231077',
      })
    ).rejects.toThrow('Já existe um paciente cadastrado com este WhatsApp');

    // 3. Cadastra outro paciente com número diferente
    const outro = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Carlos Diferente',
      whatsapp: '11988887777',
    });

    // 4. Tenta editar o número do Carlos para o número da Mariana (com 55)
    await expect(
      repo.updatePatient(outro.id, {
        whatsapp: '553798231077',
      })
    ).rejects.toThrow('Já existe outro paciente cadastrado com este WhatsApp');
  });

  it('Exclusão lógica preenche is_active = false e deleted_at no IndexedDB e na outbox', async () => {
    const patient = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Paciente Para Excluir',
      whatsapp: '11977776666',
    });

    await repo.deletePatient(patient.id);

    // No banco local:
    const inDb = await db.patients.get(patient.id);
    expect(inDb?.is_active).toBe(false);
    expect(inDb?.deleted_at).toBeDefined();
    expect(typeof inDb?.deleted_at).toBe('string');

    // Na outbox:
    const outboxItems = await db.sync_outbox.toArray();
    const deleteMutation = outboxItems.find((m) => m.operation === 'DELETE' && m.record_id === patient.id);
    expect(deleteMutation).toBeDefined();
    expect((deleteMutation?.payload as any).is_active).toBe(false);
    expect((deleteMutation?.payload as any).deleted_at).toBeDefined();
  });
});

