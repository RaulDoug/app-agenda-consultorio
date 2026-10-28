/**
 * @vitest-environment jsdom
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { CliniAssistLocalDB } from '../../local-db';
import { PatientLocalRepository } from '../patient-local-repository';

describe('PatientLocalRepository — Reativação, Busca por Telefone e Soft-Delete', () => {
  let db: CliniAssistLocalDB;
  let repo: PatientLocalRepository;
  const tenantId = 'tenant-test-patient-repo';

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test-patient-local-${Date.now()}-${Math.random()}`);
    await db.open();
    repo = new PatientLocalRepository(db);
  });

  it('AC-248: Método reactivatePatient e salvaguarda contra telefone duplicado @spec:AC-248', async () => {
    // 1. Cadastra e inativa um paciente
    const patientA = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Juliana Paes',
      whatsapp: '11988880000',
      notes: 'Observação inicial',
    });

    await repo.deletePatient(patientA.id);

    const inDbDeleted = await db.patients.get(patientA.id);
    expect(inDbDeleted?.is_active).toBe(false);
    expect(inDbDeleted?.deleted_at).not.toBeNull();

    // 2. Reativa o paciente com sucesso
    const reactivated = await repo.reactivatePatient(patientA.id, {
      name: 'Juliana Paes Silva',
      notes: 'Observação atualizada',
    });

    expect(reactivated.is_active).toBe(true);
    expect(reactivated.deleted_at).toBeNull();
    expect(reactivated.name).toBe('Juliana Paes Silva');
    expect(reactivated.notes).toBe('Observação atualizada');

    // 3. Verifica mutação UPDATE na outbox
    const outboxItems = await db.sync_outbox.where('record_id').equals(patientA.id).toArray();
    const updateMutation = outboxItems.find(
      (m) => m.entity === 'patients' && m.operation === 'UPDATE' && (m.payload as any)?.is_active === true
    );
    expect(updateMutation).toBeDefined();
    expect((updateMutation?.payload as any)?.deleted_at).toBeNull();

    // 4. Testa salvaguarda contra duplicidade:
    // Cadastra um paciente B ativo
    const patientB = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Marcos Souza',
      whatsapp: '11977771111',
    });

    // Inativa paciente B
    await repo.deletePatient(patientB.id);

    // Cadastra um novo paciente C ativo com o mesmo WhatsApp do B
    await repo.createPatient({
      tenant_id: tenantId,
      name: 'Marcos Souza Clone',
      whatsapp: '11977771111',
    });

    // Tentativa de reativar B deve ser recusada com erro claro
    await expect(repo.reactivatePatient(patientB.id)).rejects.toThrow(
      /Já existe outro paciente ativo cadastrado com este WhatsApp/
    );
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

  it('deve localizar paciente ativo ou inativo via findPatientByPhone', async () => {
    const created = await repo.createPatient({
      tenant_id: tenantId,
      name: 'Mariana Santos',
      whatsapp: '11999993333',
    });

    // Busca com formatação diferente (com DDD 55)
    const foundActive = await repo.findPatientByPhone(tenantId, '5511999993333');
    expect(foundActive).toBeDefined();
    expect(foundActive?.id).toBe(created.id);

    // Inativa paciente
    await repo.deletePatient(created.id);

    // Deve continuar encontrando mesmo inativo
    const foundInactive = await repo.findPatientByPhone(tenantId, '11999993333');
    expect(foundInactive).toBeDefined();
    expect(foundInactive?.id).toBe(created.id);
    expect(foundInactive?.is_active).toBe(false);
  });
});
