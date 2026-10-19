import React from 'react';
import { LocalAppointmentWithDetails } from '../types';
import { STATUS_TOKENS } from '../../../theme/tokens';
import { AppointmentLocalRepository, appointmentLocalRepo } from '../../../db/repositories/appointment-local-repository';
import { LocalProcedure } from '../../../db/types';
import { ProcedureLocalRepository, procedureLocalRepo } from '../../../db/repositories/procedure-local-repository';
import { FinancialLocalRepository, financialLocalRepo } from '../../../db/repositories/financial-local-repository';

interface AppointmentDetailsDrawerProps {
  isOpen: boolean;
  appointment: LocalAppointmentWithDetails | null;
  onClose: () => void;
  appointmentRepo?: AppointmentLocalRepository;
  procedureRepo?: ProcedureLocalRepository;
  financialRepo?: FinancialLocalRepository;
  tenantId?: string;
  onStatusChanged: (updated: LocalAppointmentWithDetails) => void;
  onOpenReschedule: (appointment: LocalAppointmentWithDetails) => void;
  onOpenCheckout?: (appointment: LocalAppointmentWithDetails) => void;
}

export const AppointmentDetailsDrawer: React.FC<AppointmentDetailsDrawerProps> = ({
  isOpen,
  appointment,
  onClose,
  appointmentRepo = appointmentLocalRepo,
  procedureRepo = procedureLocalRepo,
  financialRepo = financialLocalRepo,
  tenantId,
  onStatusChanged,
  onOpenReschedule,
  onOpenCheckout,
}) => {
  const [isEditingProcedures, setIsEditingProcedures] = React.useState(false);
  const [availableProcedures, setAvailableProcedures] = React.useState<LocalProcedure[]>([]);
  const [selectedProcIds, setSelectedProcIds] = React.useState<string[]>([]);
  const [isSavingProcedures, setIsSavingProcedures] = React.useState(false);
  const [isConfirmingRevert, setIsConfirmingRevert] = React.useState(false);
  const [isReverting, setIsReverting] = React.useState(false);

  // Reset do modo de edição e confirmação de estorno ao mudar de agendamento ou abrir a gaveta
  React.useEffect(() => {
    setIsEditingProcedures(false);
    setIsConfirmingRevert(false);
  }, [isOpen, appointment?.id]);

  // Bloqueio de scroll do plano de fundo enquanto a gaveta estiver aberta (AC-094)
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  const statusToken = STATUS_TOKENS[appointment.status] || STATUS_TOKENS.PENDING;

  const handleStartEditProcedures = async () => {
    const activeTenantId = tenantId || appointment.tenant_id;
    const list = await procedureRepo.listProcedures(activeTenantId);
    setAvailableProcedures(list);
    setSelectedProcIds(appointment.procedures?.map((p) => p.id) || []);
    setIsEditingProcedures(true);
  };

  const handleToggleProcedure = (procId: string) => {
    setSelectedProcIds((prev) =>
      prev.includes(procId) ? prev.filter((id) => id !== procId) : [...prev, procId]
    );
  };

  const handleSaveProcedures = async () => {
    if (isSavingProcedures) return;
    setIsSavingProcedures(true);

    try {
      const selectedProcs = availableProcedures.filter((p) => selectedProcIds.includes(p.id));
      const itemsInput = selectedProcs.map((p) => ({
        procedure_id: p.id,
        effective_price_cents: p.default_price_cents,
        duration_minutes: p.default_duration_minutes,
      }));

      const res = await appointmentRepo.updateProcedures(appointment.id, itemsInput);

      onStatusChanged({
        ...appointment,
        end_time: res.appointment.end_time,
        procedures: selectedProcs,
      });

      setIsEditingProcedures(false);
    } catch (err) {
      console.error('Erro ao atualizar procedimentos:', err);
    } finally {
      setIsSavingProcedures(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleUpdateStatus = async (newStatus: any) => {
    try {
      const updated = await appointmentRepo.updateStatus(appointment.id, newStatus);
      onStatusChanged({
        ...appointment,
        status: updated.status,
      });
    } catch (err) {
      console.error('Erro ao atualizar status do agendamento:', err);
    }
  };

  const handleExecuteRevert = async () => {
    if (isReverting) return;
    setIsReverting(true);
    try {
      await financialRepo.revertCheckout(appointment.id);
      setIsConfirmingRevert(false);
      onStatusChanged({
        ...appointment,
        status: 'CONFIRMED',
      });
    } catch (err) {
      console.error('Erro ao estornar pagamento:', err);
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="details-drawer-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusToken.badgeBg} ${statusToken.badgeText}`}
            >
              {statusToken.label}
            </span>
            {appointment.is_extra_fit && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-200 text-amber-900">
                ⚡ Encaixe
              </span>
            )}
            <h3 id="details-drawer-title" className="font-bold text-slate-900 text-base mt-1">
              {appointment.patient_name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Informações da Consulta */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-sm">
          {/* Horário */}
          <div className="flex items-center gap-2 text-slate-700">
            <span className="text-slate-400">🕒</span>
            <span className="font-medium">
              {formatDateTime(appointment.start_time)} até {new Date(appointment.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* WhatsApp */}
          {appointment.patient_whatsapp && (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
              <span className="text-xs text-slate-500 font-mono">
                {appointment.patient_whatsapp}
              </span>
              <a
                href={`https://wa.me/55${appointment.patient_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded transition"
              >
                Abrir WhatsApp
              </a>
            </div>
          )}

          {/* Procedimentos */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Procedimentos / Serviços
              </h4>
              {!isEditingProcedures && appointment.status !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={handleStartEditProcedures}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
                >
                  Alterar Procedimentos
                </button>
              )}
            </div>

            {isEditingProcedures ? (
              <div className="space-y-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Selecione os procedimentos:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableProcedures.map((p) => {
                    const isSelected = selectedProcIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleToggleProcedure(p.id)}
                        className={`w-full flex items-center justify-between p-2 rounded text-xs border transition text-left ${
                          isSelected
                            ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-slate-300 text-teal-600"
                          />
                          <span>{p.name}</span>
                          <span className="text-[10px] text-slate-400">({p.default_duration_minutes} min)</span>
                        </div>
                        <span className="font-mono text-slate-600">
                          R$ {(p.default_price_cents / 100).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleSaveProcedures}
                    disabled={isSavingProcedures || selectedProcIds.length === 0}
                    className="flex-1 py-1.5 px-3 bg-teal-600 text-white rounded text-xs font-bold hover:bg-teal-700 disabled:opacity-50 transition"
                  >
                    {isSavingProcedures ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProcedures(false)}
                    disabled={isSavingProcedures}
                    className="py-1.5 px-3 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {appointment.procedures && appointment.procedures.length > 0 ? (
                  appointment.procedures.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-xs"
                    >
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="font-mono text-slate-600">
                        R$ {(p.default_price_cents / 100).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    {appointment.notes || 'Atendimento Geral'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Observações */}
          {appointment.notes && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Observações
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Ações de Gestão de Status */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ações Rápidas
            </h4>

            {appointment.status === 'COMPLETED' ? (
              <div
                className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2"
                data-testid="completed-locked-banner"
              >
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <span>✅</span>
                  <span>Atendimento Concluído & Faturado</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Este atendimento já foi finalizado e registrado no fluxo de caixa. O status está protegido contra edições acidentais.
                </p>

                {/* Botão de Estorno / Reversão */}
                {!isConfirmingRevert ? (
                  <button
                    type="button"
                    data-testid="btn-trigger-revert"
                    onClick={() => setIsConfirmingRevert(true)}
                    className="w-full mt-2 py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    ↩️ Estornar Pagamento e Reabrir Consulta
                  </button>
                ) : (
                  <div
                    className="mt-2 p-2.5 bg-white border border-rose-300 rounded-lg space-y-2"
                    data-testid="revert-confirm-box"
                  >
                    <p className="text-xs font-medium text-rose-800">
                      Confirmar estorno? O valor sairá do caixa e o agendamento voltará para Confirmado.
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsConfirmingRevert(false)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        data-testid="btn-confirm-revert"
                        disabled={isReverting}
                        onClick={handleExecuteRevert}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-md shadow-xs transition disabled:opacity-50"
                      >
                        {isReverting ? 'Estornando...' : 'Sim, Estornar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('CONFIRMED')}
                    className="py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    ✓ Confirmar Presença
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenReschedule(appointment)}
                    className="py-2 px-3 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 transition"
                  >
                    🗓️ Remarcar Consulta
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('NO_SHOW')}
                    className="py-2 px-3 text-xs font-semibold rounded-lg bg-rose-50 text-rose-800 hover:bg-rose-100 transition"
                  >
                    ⚠️ Paciente Faltou
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenCheckout) {
                        onOpenCheckout(appointment);
                      } else {
                        handleUpdateStatus('COMPLETED');
                      }
                    }}
                    className="py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    ✔️ Concluir Atendimento
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus('CANCELLED')}
                  className="w-full py-2 text-xs font-medium text-slate-500 hover:text-rose-600 transition text-center"
                >
                  Cancelar este agendamento
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
