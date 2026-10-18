import { LocalPatient, LocalAppointment } from '../../db/types';

export interface PatientWithHistoryStatus {
  patient: LocalPatient;
  totalAppointments: number;
  nextAppointment?: LocalAppointment | null;
  lastCancelledWithoutReschedule: boolean;
  hasNoHistory: boolean;
}
