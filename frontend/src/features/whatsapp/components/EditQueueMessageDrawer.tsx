import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import type { WhatsappQueueItem } from '@cliniassist/shared';

interface EditQueueMessageDrawerProps {
  isOpen: boolean;
  item: WhatsappQueueItem | null;
  onClose: () => void;
  onSave: (appointmentId: string, message: string | null) => Promise<void>;
}

export const EditQueueMessageDrawer: React.FC<EditQueueMessageDrawerProps> = ({
  isOpen,
  item,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setText(item.custom_message || item.preview_message || '');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleInsertTag = (tag: string) => {
    setText((prev) => `${prev} ${tag}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(item.appointment_id, text.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    setSaving(true);
    try {
      await onSave(item.appointment_id, null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="edit-queue-message-drawer"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-xl border border-slate-200 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Editar Mensagem de Envio</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paciente: <span className="font-semibold text-slate-700">{item.patient_name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Texto da Mensagem
            </label>
            <textarea
              data-testid="input-custom-message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              required
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-slate-800"
              placeholder="Digite a mensagem personalizada..."
            />
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-slate-400 mr-1">Inserir variáveis:</span>
            <button
              type="button"
              onClick={() => handleInsertTag('{nome}')}
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono"
            >
              {'{nome}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag('{data}')}
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono"
            >
              {'{data}'}
            </button>
            <button
              type="button"
              onClick={() => handleInsertTag('{horario}')}
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-mono"
            >
              {'{horario}'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {item.custom_message ? (
              <button
                type="button"
                data-testid="btn-reset-default-message"
                onClick={handleResetDefault}
                disabled={saving}
                className="text-xs text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar mensagem padrão
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid="btn-save-custom-message"
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl inline-flex items-center gap-1.5 shadow-xs min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Mensagem'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

