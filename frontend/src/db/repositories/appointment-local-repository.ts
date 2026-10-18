import { CliniAssistLocalDB, localDb } from '../local-db.js';
import { enqueueMutation } from '../outbox.js';
import type { LocalAppointment, LocalAppointmentItem, AppointmentStatus } from '../types.js';

export interface CreateAppointmentItemInput {
  procedure_id: string;
  effective_price_cents: number;
  duration_minutes: number;
}

export interface CreateAppointmentInput {
  id?: string;
  tenant_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status?: AppointmentStatus;
  is_extra_fit?: boolean;
  notes?: string | null;
  items: CreateAppointmentItemInput[];
}

export class AppointmentLocalRepository {
  constructor(private db: CliniAssistLocalDB = localDb) {}

  async createAppointment(input: CreateAppointmentInput): Promise<{
    appointment: LocalAppointment;
    items: LocalAppointmentItem[];
  }> {
    const now = new Date().toISOString();
    const appId = input.id || crypto.randomUUID();

    const appointment: LocalAppointment = {
      id: appId,
      tenant_id: input.tenant_id,
      patient_id: input.patient_id,
      start_time: input.start_time,
      end_time: input.end_time,
      status: input.status || 'CONFIRMED',
      is_extra_fit: Boolean(input.is_extra_fit),
      notes: input.notes || null,
      created_at: now,
      updated_at: now,
    };

    const items: LocalAppointmentItem[] = input.items.map((it) => ({
      id: crypto.randomUUID(),
      appointment_id: appId,
      procedure_id: it.procedure_id,
      effective_price_cents: it.effective_price_cents,
      duration_minutes: it.duration_minutes,
    }));

    await this.db.transaction(
      'rw',
      [this.db.appointments, this.db.appointment_items, this.db.sync_outbox],
      async () => {
        await this.db.appointments.add(appointment);
        for (const item of items) {
          await this.db.appointment_items.add(item);
        }
        await enqueueMutation(this.db, {
          entity: 'appointments',
          recordId: appId,
          operation: 'INSERT',
          payload: {
            ...appointment,
            items,
          },
        });
      }
    );

    return { appointment, items };
  }

  async updateStatus(id: string, newStatus: AppointmentStatus): Promise<LocalAppointment> {
    const existing = await this.db.appointments.get(id);
    if (!existing) {
      throw new Error(`Agendamento com id ${id} não encontrado no banco local.`);
    }

    const now = new Date().toISOString();
    const updated: LocalAppointment = {
      ...existing,
      status: newStatus,
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.appointments, this.db.sync_outbox], async () => {
      await this.db.appointments.put(updated);
      await enqueueMutation(this.db, {
        entity: 'appointments',
        recordId: id,
        operation: 'UPDATE',
        payload: {
          id,
          status: newStatus,
          updated_at: now,
        },
      });
    });

    return updated;
  }

  async rescheduleAppointment(
    id: string,
    newStartTime: string,
    newEndTime: string,
    newStatus: AppointmentStatus = 'CONFIRMED'
  ): Promise<LocalAppointment> {
    const existing = await this.db.appointments.get(id);
    if (!existing) {
      throw new Error(`Agendamento com id ${id} não encontrado no banco local.`);
    }

    const now = new Date().toISOString();
    const updated: LocalAppointment = {
      ...existing,
      start_time: newStartTime,
      end_time: newEndTime,
      status: newStatus,
      updated_at: now,
    };

    await this.db.transaction('rw', [this.db.appointments, this.db.sync_outbox], async () => {
      await this.db.appointments.put(updated);
      await enqueueMutation(this.db, {
        entity: 'appointments',
        recordId: id,
        operation: 'UPDATE',
        payload: {
          id,
          start_time: newStartTime,
          end_time: newEndTime,
          status: newStatus,
          updated_at: now,
        },
      });
    });

    return updated;
  }

  async getAppointmentById(id: string): Promise<{
    appointment: LocalAppointment;
    items: LocalAppointmentItem[];
  } | null> {
    const appointment = await this.db.appointments.get(id);
    if (!appointment) return null;

    const items = await this.db.appointment_items.where('appointment_id').equals(id).toArray();
    return { appointment, items };
  }

  async listAppointmentsByDate(tenantId: string, dateStr: string): Promise<LocalAppointment[]> {
    // dateStr format: YYYY-MM-DD
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    return await this.db.appointments
      .where('tenant_id')
      .equals(tenantId)
      .filter((a) => a.start_time >= startOfDay && a.start_time <= endOfDay)
      .sortBy('start_time');
  }
}

export const appointmentLocalRepo = new AppointmentLocalRepository();
