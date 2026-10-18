import React, { useState, useEffect, useMemo } from 'react';
import { LocalPatient, LocalProcedure } from '../../../db/types';
import { InlinePatientForm } from './InlinePatientForm';
import { InlineProcedureForm } from './InlineProcedureForm';
import { appointmentLocalRepo } from '../../../db/repositories/appointment-local-repository';
import { patientLocalRepo } from '../../../db/repositories/patient-local-repository';
import { procedureLocalRepo } from '../../../db/repositories/procedure-local-repository';
import { LocalAppointmentWithDetails, BusinessHoursConfig, DEFAULT_BUSINESS_HOURS } from '../types';

interface QuickAppointmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  initialDate: Date;
  initialTimeStr: string;
  existingAppointments: LocalAppointmentWithDetails[];
  businessHours?: BusinessHoursConfig;
  onAppointmentCreated: (result: any) => void;
}

export const QuickAppointmentDrawer: React.FC<QuickAppointmentDrawerProps> = ({
  isOpen,
  onClose,
  tenantId,
  initialDate,
  initialTimeStr,
  existingAppointments,
  businessHours = DEFAULT_BUSINESS_HOURS,
  onAppointmentCreated,
}) => {
  const [selectedPatient, setSelectedPatient] = useState<LocalPatient | null>(null);
  const [selectedProcedures, setSelectedProcedures] = useState<LocalProcedure[]>([]);
  const [timeStr, setTimeStr] = useState(initialTimeStr);
  const [notes, setNotes] = useState('');
  const [isExtraFitOverride, setIsExtraFitOverride] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Atualizar timeStr sempre que o initialTimeStr mudar
  useEffect(() => {
    setTimeStr(initialTimeStr);
  }, [initialTimeStr]);

  // Duração calculada (mínimo 30 minutos por padrão se nenhum procedimento for selecionado)
  const totalDurationMinutes = useMemo(() => {
    if (selectedProcedures.length === 0) return 30;
    return selectedProcedures.reduce((acc, p) => acc + p.default_duration_minutes, 0);
  }, [selectedProcedures]);

  // Cálculos de datas e horas ISO
  const { startIso, endIso, isOverlapping, isOutOfHours } = useMemo(() => {
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr || '08', 10);
    const m = parseInt(mStr || '00', 10);

    const startDate = new Date(initialDate);
    startDate.setHours(h, m, 0, 0);

    const endDate = new Date(startDate.getTime() + totalDurationMinutes * 60 * 1000);

    const sIso = startDate.toISOString();
    const eIso = endDate.toISOString();

    // Checagem de fora do expediente ou almoço
    const startMinutes = h * 60 + m;
    const endMinutes = startMinutes + totalDurationMinutes;

    const expStartMinutes = businessHours.startHour * 60 + businessHours.startMinute;
    const expEndMinutes = businessHours.endHour * 60 + businessHours.endMinute;
    const lunchStartMinutes = businessHours.lunchStartHour * 60 + businessHours.lunchStartMinute;
    const lunchEndMinutes = businessHours.lunchEndHour * 60 + businessHours.lunchEndMinute;

    const outOfExpedient = startMinutes < expStartMinutes || endMinutes > expEndMinutes;
    const inLunch =
      (startMinutes >= lunchStartMinutes && startMinutes < lunchEndMinutes) ||
      (endMinutes > lunchStartMinutes && endMinutes <= lunchEndMinutes);

    const out = outOfExpedient || inLunch;

    // Checagem de sobreposição com outro agendamento ativo
    const overlap = existingAppointments.some((app) => {
      if (app.status === 'CANCELLED') return false;
      const appStart = new Date(app.start_time).getTime();
      const appEnd = new Date(app.end_time).getTime();
      const thisStart = startDate.getTime();
      const thisEnd = endDate.getTime();

      return thisStart < appEnd && thisEnd > appStart;
    });

    return {
      startIso: sIso,
      endIso: eIso,
      isOverlapping: overlap,
      isOutOfHours: out,
    };
  }, [initialDate, timeStr, totalDurationMinutes, existingAppointments, businessHours]);

  const isEncaixe = isOverlapping || isOutOfHours || isExtraFitOverride;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevenção contra duplo clique

    if (!selectedPatient) {
      setErrorMsg('Por favor, selecione ou cadastre um paciente.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const itemsInput =
        selectedProcedures.length > 0
          ? selectedProcedures.map((proc) => ({
              procedure_id: proc.id,
              effective_price_cents: proc.default_price_cents,
              duration_minutes: proc.default_duration_minutes,
            }))
          : [
              {
                procedure_id: crypto.randomUUID(),
                effective_price_cents: 15000,
                duration_minutes: 30,
              },
            ];

      const created = await appointmentLocalRepo.createAppointment({
        tenant_id: tenantId,
        patient_id: selectedPatient.id,
        start_time: startIso,
        end_time: endIso,
        status: 'CONFIRMED',
        is_extra_fit: isEncaixe,
        notes: notes.trim() || null,
        items: itemsInput,
      });

      onAppointmentCreated({
        ...created.appointment,
        patient_name: selectedPatient.name,
        patient_whatsapp: selectedPatient.whatsapp,
        procedures: selectedProcedures,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar agendamento');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(initialDate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up sm:animate-fade-in">
        {/* Cabeçalho da Gaveta */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 id="drawer-title" className="font-bold text-slate-900 text-base">
              Novo Agendamento Rápido
            </h3>
            <p className="text-xs text-slate-500 capitalize">
              {formattedDate} às {timeStr}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Alerta de Encaixe / Sobreposição */}
          {isEncaixe && (
            <div
              data-testid="encaixe-warning"
              className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-start gap-2.5"
            >
              <span className="text-base leading-none">⚡</span>
              <div>
                <span className="font-bold">Aviso de Encaixe:</span>{' '}
                {isOverlapping
                  ? 'Já existe outro atendimento agendado neste horário.'
                  : 'Horário fora do expediente regular ou durante o almoço.'}{' '}
                A consulta será marcada com o selo <strong>Encaixe</strong> sem bloquear.
              </div>
            </div>
          )}

          {/* Horário e Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário de Início
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duração Total
              </label>
              <div className="px-3 py-2 text-sm bg-slate-100 rounded-lg text-slate-700 font-medium">
                {totalDurationMinutes} min
              </div>
            </div>
          </div>

          {/* Paciente com Cadastro Inline */}
          <InlinePatientForm
            tenantId={tenantId}
            patientRepo={patientLocalRepo}
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
          />

          {/* Procedimentos com Multisseleção e Cadastro Inline */}
          <InlineProcedureForm
            tenantId={tenantId}
            procedureRepo={procedureLocalRepo}
            selectedProcedureIds={selectedProcedures.map((p) => p.id)}
            onChangeSelection={setSelectedProcedures}
          />

          {/* Observações Opcionais */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Primeira vez, prefere atendimento pontual..."
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Rodapé e Botão de Ação */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedPatient}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
