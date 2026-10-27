import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { TenantWhatsappSettings, UpdateTenantWhatsappSettingsInput } from '@cliniassist/shared';

interface WhatsappTemplatesDrawerProps {
  isOpen: boolean;
  settings: TenantWhatsappSettings | null;
  onClose: () => void;
  onSave: (input: UpdateTenantWhatsappSettingsInput) => Promise<void>;
}

export const WhatsappTemplatesDrawer: React.FC<WhatsappTemplatesDrawerProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [confirmationMsg, setConfirmationMsg] = useState('');
  const [confirmationReply, setConfirmationReply] = useState('');
  const [rescheduleReply, setRescheduleReply] = useState('');
  const [welcomeFallback, setWelcomeFallback] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setConfirmationMsg(settings.confirmation_message_template || '');
      setConfirmationReply(settings.confirmation_reply_template || '');
      setRescheduleReply(settings.reschedule_reply_template || '');
      setWelcomeFallback(settings.welcome_fallback_reply_template || '');
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        confirmation_message_template: confirmationMsg,
        confirmation_reply_template: confirmationReply,
        reschedule_reply_template: rescheduleReply,
        welcome_fallback_reply_template: welcomeFallback,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="whatsapp-templates-drawer"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6 shadow-xl border border-slate-200 animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Templates Padrão de WhatsApp</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize os textos automáticos disparados para os pacientes com Spintax.
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
              1. Mensagem de Confirmação (Disparo Inicial)
            </label>
            <textarea
              data-testid="input-template-confirmation"
              value={confirmationMsg}
              onChange={(e) => setConfirmationMsg(e.target.value)}
              rows={3}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Réplica Automática de Confirmação (Resposta Sim / 1)
            </label>
            <textarea
              data-testid="input-template-confirmation-reply"
              value={confirmationReply}
              onChange={(e) => setConfirmationReply(e.target.value)}
              rows={2}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3. Réplica Automática de Reagendamento (Resposta Remarcar / 2)
            </label>
            <textarea
              data-testid="input-template-reschedule-reply"
              value={rescheduleReply}
              onChange={(e) => setRescheduleReply(e.target.value)}
              rows={2}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. Réplica de Acolhimento Humano (Dúvidas, Texto Livre e Áudio)
            </label>
            <textarea
              data-testid="input-template-welcome-fallback"
              value={welcomeFallback}
              onChange={(e) => setWelcomeFallback(e.target.value)}
              rows={2}
              required
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-save-templates"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl inline-flex items-center gap-1.5 shadow-xs min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Gravando...' : 'Salvar Templates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
