import React, { useState, useEffect } from 'react';
import { LocalPatient } from '../../../db/types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export interface ConfirmDeletePatientModalProps {
  isOpen: boolean;
  patient: LocalPatient | null;
  onClose: () => void;
  onConfirm: (patient: LocalPatient) => Promise<void> | void;
}

export const ConfirmDeletePatientModal: React.FC<ConfirmDeletePatientModalProps> = ({
  isOpen,
  patient,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !patient) return null;

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm(patient);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-patient-modal-title"
      data-testid="confirm-delete-patient-modal"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="delete-patient-modal-title"
                data-testid="delete-patient-modal-title"
                className="font-bold text-slate-900 text-base"
              >
                Excluir Paciente
              </h3>
              <span className="text-xs text-rose-700 font-medium">Confirmação de segurança</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            Tem certeza que deseja excluir o cadastro de <strong className="text-slate-900 font-semibold">{patient.name}</strong>?
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Aviso importante:</span>
              <p className="text-slate-700 font-normal">
                O paciente será desativado e removido da listagem ativa e das opções de novo agendamento. O histórico financeiro e relatórios passados permanecerão preservados.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            data-testid="btn-cancel-delete"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="btn-confirm-delete-patient"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 min-h-[42px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? 'Excluindo...' : 'Sim, Excluir Paciente'}
          </button>
        </div>
      </div>
    </div>
  );
};
