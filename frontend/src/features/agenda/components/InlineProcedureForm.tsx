import React, { useState, useEffect } from 'react';
import { LocalProcedure } from '../../../db/types';
import { ProcedureLocalRepository } from '../../../db/repositories/procedure-local-repository';

interface InlineProcedureFormProps {
  tenantId: string;
  procedureRepo: ProcedureLocalRepository;
  selectedProcedureIds: string[];
  onChangeSelection: (procedures: LocalProcedure[]) => void;
}

export const InlineProcedureForm: React.FC<InlineProcedureFormProps> = ({
  tenantId,
  procedureRepo,
  selectedProcedureIds,
  onChangeSelection,
}) => {
  const [procedures, setProcedures] = useState<LocalProcedure[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState('30');
  const [newPriceReais, setNewPriceReais] = useState('150');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const list = await procedureRepo.listProcedures(tenantId);
      if (active) setProcedures(list);
    };
    load();
    return () => {
      active = false;
    };
  }, [tenantId, procedureRepo]);

  const handleToggleProcedure = (proc: LocalProcedure) => {
    const isSelected = selectedProcedureIds.includes(proc.id);
    let updated: LocalProcedure[];

    if (isSelected) {
      updated = procedures.filter(
        (p) => selectedProcedureIds.includes(p.id) && p.id !== proc.id
      );
    } else {
      const existing = procedures.filter((p) => selectedProcedureIds.includes(p.id));
      updated = [...existing, proc];
    }
    onChangeSelection(updated);
  };

  const handleCreateProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Informe o nome do procedimento.');
      return;
    }

    const duration = parseInt(newDuration, 10) || 30;
    const priceCents = Math.round(parseFloat(newPriceReais || '0') * 100);

    try {
      const created = await procedureRepo.createProcedure({
        tenant_id: tenantId,
        name: newName.trim(),
        default_duration_minutes: duration,
        default_price_cents: priceCents,
      });

      const updatedList = await procedureRepo.listProcedures(tenantId);
      setProcedures(updatedList);

      const currentlySelected = updatedList.filter((p) => selectedProcedureIds.includes(p.id));
      onChangeSelection([...currentlySelected, created]);

      setIsCreatingNew(false);
      setNewName('');
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar procedimento');
    }
  };

  // Cálculo do total de duração e valor
  const selectedProcedures = procedures.filter((p) => selectedProcedureIds.includes(p.id));
  const totalDurationMinutes = selectedProcedures.reduce((acc, p) => acc + p.default_duration_minutes, 0);
  const totalPriceCents = selectedProcedures.reduce((acc, p) => acc + p.default_price_cents, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          Procedimentos / Serviços
        </label>
        {!isCreatingNew && (
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="text-xs text-teal-600 hover:text-teal-800 font-medium"
          >
            + Novo Procedimento
          </button>
        )}
      </div>

      {/* Lista de Seleção de Procedimentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50/50">
        {procedures.map((proc) => {
          const isSelected = selectedProcedureIds.includes(proc.id);
          return (
            <button
              key={proc.id}
              type="button"
              onClick={() => handleToggleProcedure(proc)}
              className={`p-2 text-left rounded-md border text-xs transition flex flex-col justify-between ${
                isSelected
                  ? 'border-teal-500 bg-teal-50 text-teal-900 font-semibold'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="truncate">{proc.name}</span>
                {isSelected && <span className="text-teal-600 text-xs">✓</span>}
              </div>
              <div className="flex items-center justify-between w-full mt-1 text-[11px] text-slate-500 font-normal">
                <span>{proc.default_duration_minutes}m</span>
                <span className="font-mono">R$ {(proc.default_price_cents / 100).toFixed(2)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Criação Inline de Novo Procedimento */}
      {isCreatingNew && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="text-xs font-semibold text-slate-800">Novo Procedimento Inline</div>
          {errorMsg && <div className="text-xs text-rose-600">{errorMsg}</div>}
          <div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do procedimento"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Duração (min)</label>
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="30"
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={newPriceReais}
                onChange={(e) => setNewPriceReais(e.target.value)}
                placeholder="150.00"
                className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </div>
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
              onClick={handleCreateProcedure}
              className="px-3 py-1 bg-teal-600 text-white rounded text-xs font-semibold hover:bg-teal-700 transition"
            >
              Salvar Procedimento
            </button>
          </div>
        </div>
      )}

      {/* Resumo da seleção múltipla */}
      {selectedProcedures.length > 0 && (
        <div
          data-testid="procedures-summary"
          className="p-2.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-between"
        >
          <span>Duração: <strong>{totalDurationMinutes} min</strong></span>
          <span>Valor Sugerido: <strong>R$ {(totalPriceCents / 100).toFixed(2)}</strong></span>
        </div>
      )}
    </div>
  );
};
