import React, { useState, useEffect } from 'react';
import { LocalPatient } from '../../../db/types';
import { PatientLocalRepository } from '../../../db/repositories/patient-local-repository';
import { FileText } from 'lucide-react';

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
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    const search = async () => {
      if (!query.trim()) {
        const all = await patientRepo.listPatients(tenantId);
        if (active) setResults(all.slice(0, 5));
        return;
      }
      const found = await patientRepo.searchPatients(tenantId, query);
      if (active) setResults(found);
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
      const created = await patientRepo.createPatient({
        tenant_id: tenantId,
        name: newName.trim(),
        whatsapp: cleanPhone,
      });
      onSelectPatient(created);
      setIsCreatingNew(false);
      setQuery('');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar paciente');
    }
  };

  const hasExactMatch = results.some(
    (p) => p.name.toLowerCase() === query.trim().toLowerCase()
  );

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
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Buscar paciente"
          />

          {query.trim().length > 0 && !hasExactMatch && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  setNewName(query.trim());
                  setIsCreatingNew(true);
                  setErrorMsg('');
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg text-left transition flex items-center justify-between"
              >
                <span>+ Cadastrar "{query.trim()}"</span>
                <span className="text-[11px] font-normal text-teal-600">Cadastro rápido</span>
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-sm max-h-40 overflow-y-auto divide-y divide-slate-100">
              {results.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    onSelectPatient(patient);
                    setQuery('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between transition"
                >
                  <span className="text-xs font-medium text-slate-800">{patient.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{patient.whatsapp}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Formulário de Cadastro Inline */
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="text-xs font-semibold text-slate-800">Novo Paciente (Rápido)</div>
          {errorMsg && (
            <div className="text-xs text-rose-600 font-medium">{errorMsg}</div>
          )}
          <div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome completo"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <input
              type="tel"
              value={newWhatsapp}
              onChange={(e) => setNewWhatsapp(e.target.value)}
              placeholder="WhatsApp com DDD (Ex: 11987654321)"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="button"
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
