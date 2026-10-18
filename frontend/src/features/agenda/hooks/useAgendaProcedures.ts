import { useState, useEffect, useMemo, useCallback } from 'react';
import { LocalProcedure } from '../../../db/types';
import { procedureLocalRepo } from '../../../db/repositories/procedure-local-repository';

export interface UseAgendaProceduresResult {
  procedures: LocalProcedure[];
  selectedProcedures: LocalProcedure[];
  totalDurationMinutes: number;
  totalPriceCents: number;
  toggleProcedure: (procedure: LocalProcedure) => void;
  selectProceduresByIds: (ids: string[]) => void;
  clearSelection: () => void;
  reload: () => Promise<void>;
}

export function useAgendaProcedures(tenantId: string): UseAgendaProceduresResult {
  const [procedures, setProcedures] = useState<LocalProcedure[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadProcedures = useCallback(async () => {
    try {
      const list = await procedureLocalRepo.listProcedures(tenantId);
      setProcedures(list);
    } catch (err) {
      console.error('Erro ao carregar procedimentos:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    loadProcedures();
  }, [loadProcedures]);

  const toggleProcedure = useCallback((proc: LocalProcedure) => {
    setSelectedIds((prev) =>
      prev.includes(proc.id) ? prev.filter((id) => id !== proc.id) : [...prev, proc.id]
    );
  }, []);

  const selectProceduresByIds = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectedProcedures = useMemo(() => {
    return procedures.filter((p) => selectedIds.includes(p.id));
  }, [procedures, selectedIds]);

  const totalDurationMinutes = useMemo(() => {
    return selectedProcedures.reduce((acc, p) => acc + p.default_duration_minutes, 0);
  }, [selectedProcedures]);

  const totalPriceCents = useMemo(() => {
    return selectedProcedures.reduce((acc, p) => acc + p.default_price_cents, 0);
  }, [selectedProcedures]);

  return {
    procedures,
    selectedProcedures,
    totalDurationMinutes,
    totalPriceCents,
    toggleProcedure,
    selectProceduresByIds,
    clearSelection,
    reload: loadProcedures,
  };
}
