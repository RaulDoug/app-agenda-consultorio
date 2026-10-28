import React, { useState, useEffect } from 'react';
import { LocalPatient } from '../../../db/types';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { FileText, RotateCcw } from 'lucide-react';

interface InlinePatientFormProps {
  tenantId: string;
  patientRepo: PatientLocalRepository;
  selectedPatient: LocalPatient | null;
  onSelectPatient: (patient: LocalPatient) => void;
}

export const InlinePatientForm: React.FC<InlinePatientFormProps> = ({
  tenantId,
  patientRepo,
  selectedPatient,
  onSelectPatient,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocalPatient[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [inactiveInlinePatient, setInactiveInlinePatient] = useState<LocalPatient | null>(null);

  useEffect(() => {
    let active = true;
    const search = async () => {
      if (!query.trim()) {
        const all = await patientRepo.listPatients(tenantId);
        if (active) {
          const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name));
          setResults(sorted);
          setVisibleCount(15);
        }
        return;
      }
      const found = await patientRepo.searchPatients(tenantId, query);
      if (active) {
        const sorted = [...found].sort((a, b) => a.name.localeCompare(b.name));
        setResults(sorted);
        setVisibleCount(15);
      }
    };
    search();
    return () => {
      active = false;
    };
  }, [query, tenantId, patientRepo]);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Informe o nome do paciente.');
      return;
    }
    const cleanPhone = newWhatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Informe um WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }

    try {
      const existingByPhone = await patientRepo.findPatientByPhone(tenantId, cleanPhone);
      if (existingByPhone) {
        const isInactive = !existingByPhone.is_active || (Boolean(existingByPhone.deleted_at) && existingByPhone.deleted_at !== 'null');
        if (isInactive) {
          setInactiveInlinePatient(existingByPhone);
          setErrorMsg('');
          return;
        } else {
          setErrorMsg(`Já existe um paciente cadastrado com este WhatsApp: "${existingByPhone.name}".`);
          setInactiveInlinePatient(null);
          return;
        }
      }

      const created = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: newName.trim(),
        whatsapp: cleanPhone,
      });
      onSelectPatient(created);
      setIsCreatingNew(false);
      setInactiveInlinePatient(null);
      setQuery('');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar paciente');
    }
  };

  const handleReactivateInline = async () => {
    if (!inactiveInlinePatient) return;
    try {
      const reactivated = await patientRepo.reactivatePatient(inactiveInlinePatient.id, {
        name: newName.trim() || inactiveInlinePatient.name,
      });
      onSelectPatient(reactivated);
      setIsCreatingNew(false);
      setInactiveInlinePatient(null);
      setQuery('');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao reativar paciente.');
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 25) {
      if (visibleCount < results.length) {
        setVisibleCount((prev) => Math.min(prev + 15, results.length));
      }
    }
  };

  const hasExactMatch = results.some(
    (p) => p.name.toLowerCase() === query.trim().toLowerCase()
  );

  const visibleResults = results.slice(0, visibleCount);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700">
        Paciente / Cliente <span className="text-rose-500">*</span>
      </label>

      {selectedPatient && !isCreatingNew ? (
        <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm text-teal-900">{selectedPatient.name}</div>
              <div className="text-xs text-teal-700 font-mono">{selectedPatient.whatsapp}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectPatient(null as any);
                setQuery('');
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
            >
              Trocar
            </button>
          </div>

          {selectedPatient.notes && selectedPatient.notes.trim().length > 0 && (
            <div
              data-testid="selected-patient-notes"
              className="p-2 bg-amber-50/90 border border-amber-200 rounded-md text-xs text-amber-950 flex items-start gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-[11px] text-amber-900 uppercase tracking-wide block">
                  Observações Clínicas:
                </span>
                <p className="whitespace-pre-wrap font-normal text-slate-800 text-xs">
                  {selectedPatient.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : !isCreatingNew ? (
        <div className="relative space-y-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Buscar paciente"
          />

          {query.trim().length > 0 && !hasExactMatch && (
            <div className="mt-1">
              <button
                type="button"
                data-testid="btn-open-inline-new-patient"
                onClick={() => {
                  setNewName(query.trim());
                  setIsCreatingNew(true);
                  setErrorMsg('');
                  setInactiveInlinePatient(null);
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-left transition flex items-center justify-between"
              >
                <span>+ Cadastrar "{query.trim()}"</span>
                <span className="text-[11px] font-normal text-teal-600">Cadastro rápido</span>
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div
              data-testid="inline-patient-results-card"
              className="mt-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
            >
              <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span data-testid="inline-patient-count-indicator">
                  Exibindo {Math.min(visibleCount, results.length)} de {results.length} pacientes
                </span>
                <span className="text-[10px] text-slate-400">Ordem alfabética</span>
              </div>

              <div
                data-testid="inline-patient-scroll-container"
                onScroll={handleScroll}
                className="max-h-48 overflow-y-auto divide-y divide-slate-100"
              >
                {visibleResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    data-testid={`btn-select-patient-${patient.id}`}
                    onClick={() => {
                      onSelectPatient(patient);
                      setQuery('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-teal-50/50 flex items-center justify-between transition group"
                  >
                    <div>
                      <span className="text-xs font-medium text-slate-800 group-hover:text-teal-900 block">
                        {patient.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{patient.whatsapp}</span>
                    </div>
                    <span className="text-[11px] font-medium text-teal-700 opacity-0 group-hover:opacity-100 transition">
                      Selecionar
                    </span>
                  </button>
                ))}

                {visibleCount < results.length && (
                  <div
                    data-testid="inline-patient-scroll-hint"
                    className="p-1.5 text-center text-[10px] text-slate-400 italic bg-slate-50/50"
                  >
                    Role para carregar mais...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Formulário de Cadastro Inline */
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="text-xs font-semibold text-slate-800">Novo Paciente (Rápido)</div>

          {errorMsg && (
            <div data-testid="inline-patient-error" className="text-xs text-rose-600 font-medium">
              {errorMsg}
            </div>
          )}

          {inactiveInlinePatient && (
            <div
              data-testid="inline-inactive-patient-alert"
              className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs"
            >
              <div className="text-amber-900 font-medium leading-snug">
                Existe um cadastro inativo para este WhatsApp pertencente a{' '}
                <strong className="font-bold">{inactiveInlinePatient.name}</strong>. Deseja reativar este cliente?
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  data-testid="btn-inline-reactivate-patient"
                  onClick={handleReactivateInline}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-semibold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reativar e Selecionar
                </button>
                <button
                  type="button"
                  onClick={() => setInactiveInlinePatient(null)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div>
            <input
              type="text"
              aria-label="Nome completo"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Nome completo"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <input
              type="tel"
              aria-label="WhatsApp com DDD"
              value={newWhatsapp}
              onChange={(e) => {
                setNewWhatsapp(e.target.value);
                setInactiveInlinePatient(null);
                setErrorMsg('');
              }}
              placeholder="WhatsApp com DDD (Ex: 11987654321)"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                setInactiveInlinePatient(null);
                setErrorMsg('');
              }}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="btn-save-inline-patient"
              onClick={handleCreatePatient}
              className="px-3 py-1 bg-teal-600 text-white rounded text-xs font-semibold hover:bg-teal-700 transition"
            >
              Salvar Paciente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
