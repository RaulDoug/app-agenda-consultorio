import React, { useState, useMemo } from 'react';
import { LocalProcedure } from '../../../db/types';
import { ProcedureCard } from './ProcedureCard';
import { Search, Plus, Sparkles, X } from 'lucide-react';

export type ProcedureStatusFilter = 'active' | 'inactive' | 'all';

interface ProcedureListProps {
  tenantId: string;
  procedures: LocalProcedure[];
  onOpenCreateModal: () => void;
  onEditProcedure: (proc: LocalProcedure) => void;
  onDeleteProcedure: (proc: LocalProcedure) => void;
  onReactivateProcedure?: (proc: LocalProcedure) => void;
}

export const ProcedureList: React.FC<ProcedureListProps> = ({
  procedures,
  onOpenCreateModal,
  onEditProcedure,
  onDeleteProcedure,
  onReactivateProcedure,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProcedureStatusFilter>('active');

  const isProcInactive = (p: LocalProcedure) =>
    !p.is_active || (Boolean(p.deleted_at) && p.deleted_at !== 'null');

  const activeCount = useMemo(
    () => procedures.filter((p) => !isProcInactive(p)).length,
    [procedures]
  );
  const inactiveCount = useMemo(
    () => procedures.filter((p) => isProcInactive(p)).length,
    [procedures]
  );
  const allCount = procedures.length;

  // Filtra procedimentos por status e termo de busca
  const filteredProcedures = useMemo(() => {
    let result = procedures;

    // Filtro por status
    if (statusFilter === 'active') {
      result = result.filter((p) => !isProcInactive(p));
    } else if (statusFilter === 'inactive') {
      result = result.filter((p) => isProcInactive(p));
    }

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((proc) => proc.name.toLowerCase().includes(term));
    }

    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [procedures, statusFilter, searchTerm]);

  return (
    <div className="space-y-4" data-testid="procedure-list-container">
      {/* Cabeçalho da Lista e Barra de Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Catálogo de Procedimentos</h2>
          <p className="text-xs text-slate-500">
            Tabela de serviços clínicos, durações estimadas, valores de tabela e custos operacionais.
          </p>
        </div>

        <button
          type="button"
          data-testid="btn-new-procedure-top"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Procedimento
        </button>
      </div>

      {/* Pílulas de Filtro de Status (Ativos / Inativos / Todos) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          data-testid="filter-proc-active"
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            statusFilter === 'active'
              ? 'bg-white text-teal-800 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ativos ({activeCount})
        </button>
        <button
          type="button"
          data-testid="filter-proc-inactive"
          onClick={() => setStatusFilter('inactive')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            statusFilter === 'inactive'
              ? 'bg-white text-rose-800 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Inativos ({inactiveCount})
        </button>
        <button
          type="button"
          data-testid="filter-proc-all"
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
            statusFilter === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos ({allCount})
        </button>
      </div>

      {/* Barra de Busca e Contador */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            data-testid="input-search-procedures"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar procedimentos pelo nome..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
          />
          {searchTerm && (
            <button
              type="button"
              data-testid="btn-clear-procedure-search"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs font-medium text-slate-500 shrink-0 px-1">
          <span data-testid="procedure-count" className="font-semibold text-slate-700">
            {filteredProcedures.length}
          </span>{' '}
          {filteredProcedures.length === 1 ? 'procedimento' : 'procedimentos'}
        </div>
      </div>

      {/* Grade de Procedimentos */}
      {filteredProcedures.length > 0 ? (
        <div
          data-testid="procedures-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {filteredProcedures.map((proc) => (
            <ProcedureCard
              key={proc.id}
              procedure={proc}
              onEdit={onEditProcedure}
              onDelete={onDeleteProcedure}
              onReactivate={onReactivateProcedure}
            />
          ))}
        </div>
      ) : (
        <div
          data-testid="empty-procedures-state"
          className="text-center py-12 px-4 bg-white border border-slate-200 border-dashed rounded-2xl space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 stroke-1.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              {statusFilter === 'inactive'
                ? 'Nenhum procedimento inativado'
                : searchTerm
                ? 'Nenhum procedimento encontrado'
                : 'Nenhum procedimento ativo'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
              {statusFilter === 'inactive'
                ? 'Não há nenhum procedimento desativado no momento.'
                : searchTerm
                ? `Não encontramos resultados para "${searchTerm}". Tente outro termo.`
                : 'Cadastre os serviços e tratamentos realizados na clínica para agilizar a agenda e o financeiro.'}
            </p>
          </div>
          {statusFilter === 'active' && !searchTerm && (
            <button
              type="button"
              data-testid="btn-new-procedure-empty"
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeiro Procedimento
            </button>
          )}
        </div>
      )}
    </div>
  );
};
