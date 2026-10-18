import { LocalPatient, LocalAppointment } from '../../../db/types';

export interface InactivePatientItem {
  patient: LocalPatient;
  lastAppointmentDate: string;
  daysInactive: number;
}

export function findInactivePatients(
  patients: LocalPatient[],
  appointments: LocalAppointment[],
  now: Date = new Date()
): InactivePatientItem[] {
  const nowIso = now.toISOString();
  const nowTime = now.getTime();
  const inactives: InactivePatientItem[] = [];

  for (const patient of patients) {
    if (!patient.is_active) continue;

    // Todas as consultas concluídas do paciente
    const completedApps = appointments
      .filter((a) => a.patient_id === patient.id && a.status === 'COMPLETED')
      .sort((a, b) => b.start_time.localeCompare(a.start_time));

    // Se nunca concluiu nenhuma consulta, não é paciente antigo inativo
    if (completedApps.length === 0) continue;

    const lastCompleted = completedApps[0];
    const lastDate = new Date(lastCompleted.start_time);
    const diffDays = Math.floor((nowTime - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 180) {
      // Verifica se possui agendamento futuro ativo
      const hasFutureApp = appointments.some(
        (a) => a.patient_id === patient.id && a.start_time >= nowIso && a.status !== 'CANCELLED'
      );

      if (!hasFutureApp) {
        inactives.push({
          patient,
          lastAppointmentDate: lastCompleted.start_time,
          daysInactive: diffDays,
        });
      }
    }
  }

  // Ordena pelos que estão inativos há mais tempo
  return inactives.sort((a, b) => b.daysInactive - a.daysInactive);
}

export function generateReactivationMessage(patientName: string): string {
  const firstName = patientName.split(' ')[0] || 'Cliente';
  return `Olá ${firstName}, tudo bem? Já faz um tempo desde seu último atendimento no consultório. Que tal agendarmos uma consulta de revisão para cuidar do seu bem-estar?`;
}
