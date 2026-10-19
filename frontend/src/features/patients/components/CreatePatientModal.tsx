import React, { useState, useEffect } from 'react';
import { LocalPatient } from '../../../db/types';
import { PatientLocalRepository, patientLocalRepo } from '../../../db/repositories/patient-local-repository';
import { User, Phone, FileText, X, Trash2 } from 'lucide-react';

export interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  patientRepo?: PatientLocalRepository;
  patientToEdit?: LocalPatient | null;
  onPatientCreated?: (patient: LocalPatient) => void;
  onPatientSaved?: (patient: LocalPatient) => void;
  onDeletePatient?: (patient: LocalPatient) => void;
}

export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  patientRepo = patientLocalRepo,
  patientToEdit,
  onPatientCreated,
  onPatientSaved,
  onDeletePatient,
}) => {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = Boolean(patientToEdit);

  // Inicializa ou reseta formulário conforme modal abre ou paciente muda
  useEffect(() => {
    if (isOpen) {
      if (patientToEdit) {
        setName(patientToEdit.name || '');
        setWhatsapp(patientToEdit.whatsapp || '');
        setNotes(patientToEdit.notes || '');
      } else {
        setName('');
        setWhatsapp('');
        setNotes('');
      }
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, patientToEdit]);

  // Bloqueio de scroll do plano de fundo
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setErrorMsg('Informe o nome do paciente.');
      return;
    }

    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Informe um WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let savedPatient: LocalPatient;
      if (isEditing && patientToEdit) {
        savedPatient = await patientRepo.updatePatient(patientToEdit.id, {
          name: name.trim(),
          whatsapp: cleanPhone,
          notes: notes.trim() || null,
        });
        onPatientSaved?.(savedPatient);
      } else {
        savedPatient = await patientRepo.createPatient({
          tenant_id: tenantId,
          name: name.trim(),
          whatsapp: cleanPhone,
          notes: notes.trim() || undefined,
        });
        onPatientCreated?.(savedPatient);
        onPatientSaved?.(savedPatient);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          (isEditing ? 'Erro ao salvar alterações do paciente.' : 'Erro ao cadastrar paciente.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-patient-title"
      data-testid="create-patient-modal"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up sm:animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 id="create-patient-title" className="font-bold text-slate-900 text-base">
              {isEditing ? 'Editar Paciente' : 'Novo Paciente'}
            </h3>
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Completo *
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white transition">
              <User className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                aria-label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria Oliveira"
                className="w-full text-xs text-slate-900 bg-transparent focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              WhatsApp / Celular com DDD *
            </label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white transition">
              <Phone className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="tel"
                aria-label="WhatsApp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: 11 99999-8888"
                className="w-full text-xs font-mono text-slate-900 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Histórico Clínico (Opcional)
            </label>
            <div className="flex items-start bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus-within:ring-2 focus-within:ring-teal-500 focus-within:bg-white transition">
              <FileText className="w-4 h-4 text-slate-400 mr-2 mt-0.5 shrink-0" />
              <textarea
                aria-label="Observações"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alergias, preferências de horário, indicação..."
                rows={3}
                className="w-full text-xs text-slate-900 bg-transparent focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Rodapé com Botões */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              {isEditing && patientToEdit && onDeletePatient && (
                <button
                  type="button"
                  data-testid="btn-delete-patient-modal"
                  onClick={() => {
                    onDeletePatient(patientToEdit);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Excluir Paciente
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid={isEditing ? 'btn-save-patient' : 'btn-submit-patient'}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting
                  ? isEditing
                    ? 'Salvando...'
                    : 'Cadastrando...'
                  : isEditing
                  ? 'Salvar Alterações'
                  : 'Cadastrar Paciente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
