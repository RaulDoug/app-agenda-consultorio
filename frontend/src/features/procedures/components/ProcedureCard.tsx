import React from 'react';
import { LocalProcedure } from '../../../db/types';
import { Clock, Tag, Coins, TrendingUp, Pencil, Trash2, RotateCcw } from 'lucide-react';

interface ProcedureCardProps {
  procedure: LocalProcedure;
  onEdit?: (proc: LocalProcedure) => void;
  onDelete?: (proc: LocalProcedure) => void;
  onReactivate?: (proc: LocalProcedure) => void;
}

export const ProcedureCard: React.FC<ProcedureCardProps> = ({
  procedure,
  onEdit,
  onDelete,
  onReactivate,
}) => {
  const isInactive = !procedure.is_active || (Boolean(procedure.deleted_at) && procedure.deleted_at !== 'null');
  const priceCents = procedure.default_price_cents || 0;
  const costCents = procedure.cost_cents || 0;
  const marginCents = priceCents - costCents;

  const formattedPrice =
    priceCents === 0
      ? 'Gratuito / Cortesia'
      : `R$ ${(priceCents / 100).toFixed(2).replace('.', ',')}`;

  const formattedCost = `R$ ${(costCents / 100).toFixed(2).replace('.', ',')}`;
  const formattedMargin = `R$ ${(marginCents / 100).toFixed(2).replace('.', ',')}`;

  return (
    <div
      data-testid={`procedure-card-${procedure.id}`}
      className={`p-4 border rounded-2xl shadow-2xs transition flex flex-col justify-between gap-3 group ${
        isInactive
          ? 'bg-slate-50/80 border-dashed border-slate-300 opacity-90'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`font-bold text-sm sm:text-base leading-snug line-clamp-2 ${
                  isInactive ? 'text-slate-500 line-through' : 'text-slate-900'
                }`}
              >
                {procedure.name}
              </h4>
              {isInactive && (
                <span
                  data-testid={`badge-inactive-${procedure.id}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md shrink-0"
                >
                  Inativo
                </span>
              )}
            </div>
          </div>
          <span
            data-testid={`badge-duration-${procedure.id}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0"
          >
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            {procedure.default_duration_minutes} min
          </span>
        </div>

        {/* Informações Financeiras e Métricas */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Tag className="w-2.5 h-2.5 text-teal-600" />
              Preço de Tabela
            </span>
            <span
              data-testid={`procedure-price-${procedure.id}`}
              className="font-bold text-slate-800 font-mono mt-0.5"
            >
              {formattedPrice}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Coins className="w-2.5 h-2.5 text-amber-600" />
              Custo Insumos
            </span>
            <span
              data-testid={`procedure-cost-${procedure.id}`}
              className="font-bold text-slate-700 font-mono mt-0.5"
            >
              {formattedCost}
            </span>
          </div>
        </div>

        {/* Margem Bruta Estimada */}
        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-teal-50/60 border border-teal-100/80 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-teal-900 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-teal-600 shrink-0" />
            Margem Bruta Estimada
          </span>
          <span
            data-testid={`procedure-margin-${procedure.id}`}
            className={`font-mono font-bold text-xs ${
              marginCents >= 0 ? 'text-teal-800' : 'text-rose-700'
            }`}
          >
            {formattedMargin}
          </span>
        </div>
      </div>

      {/* Ações: Editar, Excluir ou Reativar */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
        <button
          type="button"
          data-testid={`btn-edit-${procedure.id}`}
          onClick={() => onEdit?.(procedure)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>

        {isInactive ? (
          <button
            type="button"
            data-testid={`btn-reactivate-${procedure.id}`}
            onClick={() => onReactivate?.(procedure)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reativar
          </button>
        ) : (
          <button
            type="button"
            data-testid={`btn-delete-${procedure.id}`}
            onClick={() => onDelete?.(procedure)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </button>
        )}
      </div>
    </div>
  );
};
