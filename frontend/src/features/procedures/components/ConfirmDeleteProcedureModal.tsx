import React, { useState, useEffect } from 'react';
import { LocalProcedure } from '../../../db/types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteProcedureModalProps {
  isOpen: boolean;
  procedure: LocalProcedure | null;
  onClose: () => void;
  onConfirm: (procedure: LocalProcedure) => Promise<void> | void;
}

export const ConfirmDeleteProcedureModal: React.FC<ConfirmDeleteProcedureModalProps> = ({
  isOpen,
  procedure,
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

  if (!isOpen || !procedure) return null;

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm(procedure);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-procedure-modal-title"
      data-testid="confirm-delete-procedure-modal"
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
                id="delete-procedure-modal-title"
                data-testid="delete-procedure-modal-title"
                className="font-bold text-slate-900 text-base"
              >
                Excluir Procedimento
              </h3>
              <span className="text-xs text-rose-700 font-medium">Confirmação de segurança</span>
            </div>
          </div>
          <button
            type="button"
            data-testid="btn-close-delete-modal"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Alerta */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold">
                Tem certeza que deseja inativar o procedimento &ldquo;{procedure.name}&rdquo;?
              </p>
              <p className="text-amber-800">
                O procedimento não aparecerá mais para novos agendamentos no catálogo ativo. Consultas
                anteriores e relatórios financeiros manterão os registros e valores históricos 100% intactos.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé / Ações */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            data-testid="btn-cancel-delete-procedure"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="btn-confirm-delete-procedure"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Excluindo...' : 'Sim, Excluir Procedimento'}
          </button>
        </div>
      </div>
    </div>
  );
};
