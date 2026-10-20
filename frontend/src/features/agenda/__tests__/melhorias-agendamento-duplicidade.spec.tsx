/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import 'fake-indexeddb/auto';
import { CliniAssistLocalDB } from '../../../db/local-db.js';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository.js';
import { AppointmentLocalRepository } from '../../../db/repositories/appointment-local-repository.js';
import { ProcedureLocalRepository } from '../../../db/repositories/procedure-local-repository.js';
import { QuickAppointmentDrawer } from '../components/QuickAppointmentDrawer.js';
import { CreatePatientModal } from '../../patients/components/CreatePatientModal.js';
import { InlinePatientForm } from '../components/InlinePatientForm.js';
import {
  getSmartDefaultAppointmentDateTime,
  formatDateToYMD,
} from '../utils/time-slots.js';
import { DEFAULT_BUSINESS_HOURS, LocalAppointmentWithDetails } from '../types.js';

describe('Melhorias em Agendamento e Bloqueio de Duplicidade de Clientes', () => {
  let db: CliniAssistLocalDB;
  let patientRepo: PatientLocalRepository;
  let appointmentRepo: AppointmentLocalRepository;
  let procedureRepo: ProcedureLocalRepository;
  const tenantId = 'tenant-test-123';

  beforeEach(async () => {
    db = new CliniAssistLocalDB(`test_db_${Date.now()}_${Math.random()}`);
    await db.open();
    patientRepo = new PatientLocalRepository(db);
    appointmentRepo = new AppointmentLocalRepository(db);
    procedureRepo = new ProcedureLocalRepository(db);
  });

  describe('US-098 / AC-175: Pré-seleção Inteligente de Data e Horário', () => {
    it('deve pré-selecionar o próximo slot futuro no mesmo dia quando dentro do expediente @spec:AC-175', () => {
      // 14:10 de uma terça-feira
      const now = new Date(2026, 9, 20, 14, 10, 0);
      const res = getSmartDefaultAppointmentDateTime(now, now, DEFAULT_BUSINESS_HOURS);

      expect(res.dateStr).toBe('2026-10-20');
      expect(res.timeStr).toBe('14:30');
      expect(res.advancedToNextDay).toBe(false);
    });

    it('deve pré-selecionar o início do expediente quando o horário for antes da abertura @spec:AC-175', () => {
      // 06:45 da manhã
      const now = new Date(2026, 9, 20, 6, 45, 0);
      const res = getSmartDefaultAppointmentDateTime(now, now, DEFAULT_BUSINESS_HOURS);

      expect(res.dateStr).toBe('2026-10-20');
      expect(res.timeStr).toBe('08:00');
      expect(res.advancedToNextDay).toBe(false);
    });

    it('deve pular para o término do almoço quando cair no intervalo de pausa @spec:AC-175', () => {
      // 12:15 (almoço é 12:00 às 13:00)
      const now = new Date(2026, 9, 20, 12, 15, 0);
      const res = getSmartDefaultAppointmentDateTime(now, now, DEFAULT_BUSINESS_HOURS);

      expect(res.dateStr).toBe('2026-10-20');
      expect(res.timeStr).toBe('13:00');
      expect(res.advancedToNextDay).toBe(false);
    });

    it('deve avançar para o dia seguinte às 08:00 quando horário atual for igual ou posterior ao fechamento @spec:AC-175', () => {
      // 19:30 da noite (consultório fecha às 18:00)
      const now = new Date(2026, 9, 20, 19, 30, 0);
      const res = getSmartDefaultAppointmentDateTime(now, now, DEFAULT_BUSINESS_HOURS);

      expect(res.dateStr).toBe('2026-10-21');
      expect(res.timeStr).toBe('08:00');
      expect(res.advancedToNextDay).toBe(true);
    });

    it('deve manter a data futura e horário inicial quando navegando em dias futuros @spec:AC-175', () => {
      const now = new Date(2026, 9, 20, 14, 0, 0);
      const futureDate = new Date(2026, 9, 28, 0, 0, 0);
      const res = getSmartDefaultAppointmentDateTime(now, futureDate, DEFAULT_BUSINESS_HOURS);

      expect(res.dateStr).toBe('2026-10-28');
      expect(res.timeStr).toBe('08:00');
      expect(res.advancedToNextDay).toBe(false);
    });
  });

  describe('US-099 / AC-176: Exibição Estrita sob Demanda da Opção de Encaixe', () => {
    it('NÃO deve exibir nenhuma opção ou checkbox de encaixe quando o horário for regular e livre @spec:AC-176', () => {
      const testDate = new Date(2026, 9, 21, 10, 0, 0);
      render(
        <QuickAppointmentDrawer
          isOpen={true}
          onClose={() => {}}
          tenantId={tenantId}
          initialDate={testDate}
          initialTimeStr="10:00"
          existingAppointments={[]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={() => {}}
        />
      );

      // Não deve renderizar aviso nem checkbox de encaixe
      expect(screen.queryByTestId('encaixe-warning')).toBeNull();
      expect(screen.queryByText(/Marcar como Encaixe/i)).toBeNull();
      expect(screen.queryByText(/Permitir Encaixe/i)).toBeNull();
    });

    it('DEVE exibir aviso e checkbox de encaixe quando houver conflito de sobreposição @spec:AC-176', () => {
      const testDate = new Date(2026, 9, 21, 10, 0, 0);
      const conflictingAppointment: LocalAppointmentWithDetails = {
        id: 'app-existente',
        tenant_id: tenantId,
        patient_id: 'p-1',
        patient_name: 'Marcos Roberto',
        start_time: testDate.toISOString(),
        end_time: new Date(testDate.getTime() + 30 * 60000).toISOString(),
        status: 'CONFIRMED',
        is_extra_fit: false,
      };

      render(
        <QuickAppointmentDrawer
          isOpen={true}
          onClose={() => {}}
          tenantId={tenantId}
          initialDate={testDate}
          initialTimeStr="10:00"
          existingAppointments={[conflictingAppointment]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={() => {}}
        />
      );

      // Deve exibir o aviso destacado no centro do formulário
      const warning = screen.getByTestId('encaixe-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent('Aviso de Encaixe:');
      expect(warning).toHaveTextContent('Permitir Encaixe / Horário Extra');
    });

    it('DEVE exibir aviso de encaixe quando o horário for fora do expediente ou durante almoço @spec:AC-176', () => {
      const testDate = new Date(2026, 9, 21, 12, 30, 0);

      render(
        <QuickAppointmentDrawer
          isOpen={true}
          onClose={() => {}}
          tenantId={tenantId}
          initialDate={testDate}
          initialTimeStr="12:30"
          existingAppointments={[]}
          appointmentRepo={appointmentRepo}
          patientRepo={patientRepo}
          procedureRepo={procedureRepo}
          onAppointmentCreated={() => {}}
        />
      );

      // 12:30 está no horário de almoço padrão (12:00 - 13:00)
      const warning = screen.getByTestId('encaixe-warning');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent('fora do expediente regular ou durante o almoço');
    });
  });

  describe('US-100 / AC-177: Bloqueio de Duplicidade de WhatsApp de Clientes', () => {
    it('deve bloquear criação de paciente com WhatsApp duplicado no repositório local @spec:AC-177', async () => {
      // 1. Cadastra o primeiro paciente
      await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Camila Santos',
        whatsapp: '(11) 99999-1111',
      });

      // 2. Tenta cadastrar outro paciente com o mesmo número (diferente formatação)
      await expect(
        patientRepo.createPatient({
          tenant_id: tenantId,
          name: 'Camila Clone',
          whatsapp: '11999991111',
        })
      ).rejects.toThrow('Já existe um paciente cadastrado com este WhatsApp: "Camila Santos".');
    });

    it('deve permitir mesmo WhatsApp em tenants diferentes (isolamento multi-tenant) @spec:AC-177', async () => {
      await patientRepo.createPatient({
        tenant_id: 'tenant-clinica-A',
        name: 'Roberto Alpha',
        whatsapp: '11988887777',
      });

      // Mesma chave de telefone, porém em tenant diferente
      const pacienteB = await patientRepo.createPatient({
        tenant_id: 'tenant-clinica-B',
        name: 'Roberto Beta',
        whatsapp: '11988887777',
      });

      expect(pacienteB.id).toBeDefined();
      expect(pacienteB.name).toBe('Roberto Beta');
    });

    it('deve bloquear atualização de WhatsApp para número de outro paciente @spec:AC-177', async () => {
      const p1 = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Ana Fonseca',
        whatsapp: '11977771111',
      });

      const p2 = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Bruno Lima',
        whatsapp: '11977772222',
      });

      // Tenta atualizar Bruno com o WhatsApp da Ana
      await expect(
        patientRepo.updatePatient(p2.id, {
          whatsapp: '(11) 97777-1111',
        })
      ).rejects.toThrow('Já existe outro paciente cadastrado com este WhatsApp: "Ana Fonseca".');

      // Atualizar mantendo o próprio número não deve lançar erro
      const p2Atualizado = await patientRepo.updatePatient(p2.id, {
        name: 'Bruno Lima Atualizado',
        whatsapp: '11977772222',
      });
      expect(p2Atualizado.name).toBe('Bruno Lima Atualizado');
    });

    it('deve exibir mensagem de erro na interface ao tentar salvar cliente duplicado no CreatePatientModal @spec:AC-177', async () => {
      await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Juliana Costa',
        whatsapp: '11987654321',
      });

      render(
        <CreatePatientModal
          isOpen={true}
          onClose={() => {}}
          tenantId={tenantId}
          patientRepo={patientRepo}
        />
      );

      // Preenche os dados com o mesmo WhatsApp
      fireEvent.change(screen.getByLabelText(/Nome Completo/i), {
        target: { value: 'Juliana Clone' },
      });
      fireEvent.change(screen.getByLabelText(/WhatsApp/i), {
        target: { value: '(11) 98765-4321' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Cadastrar Paciente/i }));

      // Deve exibir mensagem descritiva no modal e não fechar
      await waitFor(() => {
        expect(
          screen.getByText(/Já existe um paciente cadastrado com este WhatsApp: "Juliana Costa"/i)
        ).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem de erro no cadastro inline rápido ao informar WhatsApp duplicado @spec:AC-177', async () => {
      await patientRepo.createPatient({
        tenant_id: tenantId,
        name: 'Marcos Dias',
        whatsapp: '11966665555',
      });

      render(
        <InlinePatientForm
          tenantId={tenantId}
          patientRepo={patientRepo}
          selectedPatient={null}
          onSelectPatient={() => {}}
        />
      );

      // Digita no campo de busca para acionar o botão de cadastro rápido
      const searchInput = screen.getByPlaceholderText(/Buscar por nome ou WhatsApp/i);
      fireEvent.change(searchInput, { target: { value: 'Marcos Novo' } });

      const btnCadastrar = await screen.findByText(/\+ Cadastrar "Marcos Novo"/i);
      fireEvent.click(btnCadastrar);

      // No formulário inline, preenche o WhatsApp duplicado
      const whatsappInput = screen.getByPlaceholderText(/WhatsApp com DDD/i);
      fireEvent.change(whatsappInput, { target: { value: '11966665555' } });

      const btnSalvar = screen.getByRole('button', { name: /Salvar Paciente/i });
      fireEvent.click(btnSalvar);

      // Deve exibir o erro no formulário inline
      await waitFor(() => {
        expect(
          screen.getByText(/Já existe um paciente cadastrado com este WhatsApp: "Marcos Dias"/i)
        ).toBeInTheDocument();
      });
    });
  });
});
