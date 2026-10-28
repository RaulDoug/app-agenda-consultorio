import React, { useState, useMemo } from 'react';
import { LocalPatient, LocalAppointment, LocalFinancialTransaction } from '../../../db/types';
import { PatientWithHistoryStatus } from '../types';
import { PatientCard } from './PatientCard';

export type PatientStatusFilter = 'active' | 'inactive' | 'all';

interface PatientListProps {
  tenantId: string;
  patients: LocalPatient[];
  appointments: LocalAppointment[];
  transactions?: LocalFinancialTransaction[];
  onSelectPatient?: (patient: PatientWithHistoryStatus) => void;
  onSchedule?: (patient: PatientWithHistoryStatus) => void;
  onOpenCreateModal?: () => void;
  onEditPatient?: (patient: LocalPatient) => void;
  onDeletePatient?: (patient: LocalPatient) => void;
  onReactivatePatient?: (patient: LocalPatient) => void;
  onOpenFinancial?: (patient: LocalPatient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  appointments,
  transactions = [],
  onSelectPatient,
  onSchedule,
  onOpenCreateModal,
  onEditPatient,
  onDeletePatient,
  onReactivatePatient,
  onOpenFinancial,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>('active');

  const isPatientInactive = (p: LocalPatient) =>
    !p.is_active || (Boolean(p.deleted_at) && p.deleted_at !== 'null');

  const activeCount = useMemo(
    () => patients.filter((p) => !isPatientInactive(p)).length,
    [patients]
  );
  const inactiveCount = useMemo(
    () => patients.filter((p) => isPatientInactive(p)).length,
    [patients]
  );
  const allCount = patients.length;

  // Mapeia débitos pendentes por paciente através de seus agendamentos
  const pendingByPatient = useMemo(() => {
    const map = new Map<string, number>();
    const appToPatient = new Map<string, string>();
    appointments.forEach((a) => {
      appToPatient.set(a.id, a.patient_id);
    });

    transactions.forEach((t) => {
      if (t.is_active && !t.deleted_at && t.type === 'INCOME' && t.status === 'PENDING' && t.appointment_id) {
        const patientId = appToPatient.get(t.appointment_id);
        if (patientId) {
          map.set(patientId, (map.get(patientId) || 0) + t.amount_cents);
        }
      }
    });

    return map;
  }, [appointments, transactions]);

  // Computa o histórico e status de cada paciente
  const patientsWithStatus: PatientWithHistoryStatus[] = useMemo(() => {
    const nowIso = new Date().toISOString();

    return patients.map((patient) => {
      const patientApps = appointments
        .filter((a) => a.patient_id === patient.id)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const totalAppointments = patientApps.length;
      const hasNoHistory = totalAppointments === 0;

      // Próxima consulta futura ativa
      const futureActive = patientApps.find(
        (a) => a.start_time >= nowIso && a.status !== 'CANCELLED'
      );

      // Última consulta do histórico
      const lastApp = patientApps[patientApps.length - 1];
      const lastCancelledWithoutReschedule =
        Boolean(lastApp && lastApp.status === 'CANCELLED' && !futureActive);

      return {
        patient,
        totalAppointments,
        nextAppointment: futureActive || null,
        lastCancelledWithoutReschedule,
        hasNoHistory,
      };
    });
  }, [patients, appointments]);

  // Filtra por status e termo de busca, com ordenação alfabética
  const filtered = useMemo(() => {
    let result = patientsWithStatus;

    if (statusFilter === 'active') {
      result = result.filter((item) => !isPatientInactive(item.patient));
    } else if (statusFilter === 'inactive') {
      result = result.filter((item) => isPatientInactive(item.patient));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.patient.name.toLowerCase().includes(term) ||
          item.patient.whatsapp.includes(term)
      );
    }

    return [...result].sort((a, b) => a.patient.name.localeCompare(b.patient.name));
  }, [patientsWithStatus, statusFilter, searchTerm]);

  return (
    <div className="space-y-4" data-testid="patient-list-container">
      {/* Pílulas de Filtro de Status (Ativos / Inativos / Todos) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          data-testid="filter-patient-active"
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            statusFilter === 'active'
              ? 'bg-white text-teal-800 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ativos ({activeCount})
        </button>
        <button
          type="button"
          data-testid="filter-patient-inactive"
          onClick={() => setStatusFilter('inactive')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            statusFilter === 'inactive'
              ? 'bg-white text-rose-800 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Inativos ({inactiveCount})
        </button>
        <button
          type="button"
          data-testid="filter-patient-all"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            statusFilter === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos ({allCount})
        </button>
      </div>

      {/* Barra de Busca e Botão Novo Paciente */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            data-testid="input-search-patients"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar cliente por nome ou WhatsApp..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
            aria-label="Buscar clientes"
          />
          {searchTerm && (
            <button
              type="button"
              data-testid="btn-clear-patient-search"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-start">
          <div className="text-xs font-medium text-slate-500 shrink-0 px-1">
            <span data-testid="patient-count" className="font-semibold text-slate-700">
              {filtered.length}
            </span>{' '}
            {filtered.length === 1 ? 'cliente' : 'clientes'}
          </div>

          {onOpenCreateModal && (
            <button
              type="button"
              data-testid="btn-new-patient"
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0"
            >
              + Novo Paciente
            </button>
          )}
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div
            data-testid="empty-patients-state"
            className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-sm space-y-1"
          >
            <div className="font-semibold text-slate-700">
              {statusFilter === 'inactive'
                ? 'Nenhum cliente inativado'
                : searchTerm
                ? 'Nenhum cliente encontrado'
                : 'Nenhum cliente ativo'}
            </div>
            <p className="text-xs text-slate-400">
              {statusFilter === 'inactive'
                ? 'Não há nenhum cliente desativado no momento.'
                : searchTerm
                ? `Não encontramos resultados para "${searchTerm}". Tente outro termo.`
                : 'Cadastre os pacientes da clínica para acompanhar atendimentos e histórico.'}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <PatientCard
              key={item.patient.id}
              item={item}
              pendingAmountCents={pendingByPatient.get(item.patient.id) || 0}
              onClick={onSelectPatient}
              onSchedule={onSchedule}
              onEdit={onEditPatient}
              onDelete={onDeletePatient}
              onReactivate={onReactivatePatient}
              onOpenFinancial={onOpenFinancial}
            />
          ))
        )}
      </div>
    </div>
  );
};
