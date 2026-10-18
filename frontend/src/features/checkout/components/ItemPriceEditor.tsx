import React from 'react';
import { SplitResultItem } from '../utils/discount-splitter';

interface ItemPriceEditorProps {
  items: SplitResultItem[];
  onUpdateItemPrice: (id: string, newPriceCents: number) => void;
  onRemoveItem: (id: string) => void;
}

export const ItemPriceEditor: React.FC<ItemPriceEditorProps> = ({
  items,
  onUpdateItemPrice,
  onRemoveItem,
}) => {
  return (
    <div className="space-y-2" data-testid="item-price-editor">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Procedimentos Cobrados
      </div>

      {items.length === 0 ? (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs italic text-center">
          Nenhum procedimento selecionado.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
          {items.map((item) => {
            const baseReais = (item.basePriceCents / 100).toFixed(2);
            const effectiveReais = (item.effectivePriceCents / 100).toFixed(2);
            const discountReais = (item.discountCents / 100).toFixed(2);
            const hasDiscount = item.discountCents > 0;

            return (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                data-testid={`item-row-${item.id}`}
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate">{item.name}</h5>
                  {hasDiscount && (
                    <div className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5">
                      <span>Rateio: -R$ {discountReais}</span>
                      <span className="font-semibold text-teal-800">
                        (Final: R$ {effectiveReais})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={baseReais}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateItemPrice(item.id, Math.round(val * 100));
                      }}
                      className="w-20 text-xs font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-right"
                      aria-label={`Preço de ${item.name}`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                    aria-label={`Remover ${item.name}`}
                    title="Remover procedimento"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
