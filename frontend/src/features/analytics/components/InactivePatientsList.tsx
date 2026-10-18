import React, { useMemo } from 'react';
import { LocalPatient, LocalAppointment } from '../../../db/types';
import { findInactivePatients, generateReactivationMessage } from '../utils/inactive-finder';

interface InactivePatientsListProps {
  patients: LocalPatient[];
  appointments: LocalAppointment[];
  onSchedule?: (patient: LocalPatient) => void;
}

export const InactivePatientsList: React.FC<InactivePatientsListProps> = ({
  patients,
  appointments,
  onSchedule,
}) => {
  const inactives = useMemo(() => {
    return findInactivePatients(patients, appointments);
  }, [patients, appointments]);

  return (
    <div className="space-y-3" data-testid="inactive-patients-list">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Reativação de Pacientes Inativos
          </h4>
          <p className="text-[11px] text-slate-500">
            Pacientes sem consulta há mais de 180 dias e sem retorno agendado
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
          {inactives.length} inativo(s)
        </span>
      </div>

      {inactives.length === 0 ? (
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-800 text-xs text-center font-medium">
          🎉 Excelente! Nenhum paciente inativo há mais de 6 meses sem retorno agendado.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
          {inactives.map((item) => {
            const { patient, daysInactive, lastAppointmentDate } = item;
            const message = generateReactivationMessage(patient.name);
            const cleanPhone = patient.whatsapp.replace(/\D/g, '');
            const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;

            const lastFormatted = new Date(lastAppointmentDate).toLocaleDateString('pt-BR');

            return (
              <div
                key={patient.id}
                className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                data-testid={`inactive-patient-row-${patient.id}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-900">{patient.name}</h5>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                      {daysInactive} dias sem retorno
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    WhatsApp: {patient.whatsapp} • Última consulta: {lastFormatted}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 active:scale-95"
                    aria-label={`Chamar ${patient.name} no WhatsApp`}
                  >
                    <span>💬</span>
                    <span>Chamar no WhatsApp</span>
                  </a>

                  {onSchedule && (
                    <button
                      type="button"
                      onClick={() => onSchedule(patient)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                    >
                      + Agendar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
