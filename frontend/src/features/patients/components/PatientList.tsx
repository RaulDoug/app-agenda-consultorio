import React, { useState, useMemo } from 'react';
import { LocalPatient, LocalAppointment } from '../../../db/types';
import { PatientWithHistoryStatus } from '../types';
import { PatientCard } from './PatientCard';

interface PatientListProps {
  tenantId: string;
  patients: LocalPatient[];
  appointments: LocalAppointment[];
  onSelectPatient?: (patient: PatientWithHistoryStatus) => void;
  onSchedule?: (patient: PatientWithHistoryStatus) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  patients,
  appointments,
  onSelectPatient,
  onSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filtro por termo de busca
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return patientsWithStatus;
    const term = searchTerm.toLowerCase().trim();
    return patientsWithStatus.filter(
      (item) =>
        item.patient.name.toLowerCase().includes(term) ||
        item.patient.whatsapp.includes(term)
    );
  }, [patientsWithStatus, searchTerm]);

  return (
    <div className="space-y-4" data-testid="patient-list-container">
      {/* Barra de Busca */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar cliente por nome ou WhatsApp..."
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
          aria-label="Buscar clientes"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
            Nenhum cliente encontrado.
          </div>
        ) : (
          filtered.map((item) => (
            <PatientCard
              key={item.patient.id}
              item={item}
              onClick={onSelectPatient}
              onSchedule={onSchedule}
            />
          ))
        )}
      </div>
    </div>
  );
};
