import React, { useState, useEffect } from 'react';
import { LocalProcedure } from '../../../db/types';
import { ProcedureLocalRepository } from '../../../db/repositories/procedure-local-repository';
import { Sparkles, Clock, Tag, Coins, TrendingUp, X } from 'lucide-react';

interface ProcedureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  procedureRepo: ProcedureLocalRepository;
  procedureToEdit?: LocalProcedure | null;
  onProcedureSaved?: (procedure: LocalProcedure) => void;
}

export const ProcedureFormModal: React.FC<ProcedureFormModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  procedureRepo,
  procedureToEdit,
  onProcedureSaved,
}) => {
  const isEditing = Boolean(procedureToEdit);

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('30');
  const [priceReais, setPriceReais] = useState('150.00');
  const [costReais, setCostReais] = useState('0.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (procedureToEdit) {
        setName(procedureToEdit.name || '');
        setDuration(String(procedureToEdit.default_duration_minutes || 30));
        setPriceReais(((procedureToEdit.default_price_cents || 0) / 100).toFixed(2));
        setCostReais(((procedureToEdit.cost_cents || 0) / 100).toFixed(2));
      } else {
        setName('');
        setDuration('30');
        setPriceReais('150.00');
        setCostReais('0.00');
      }
      setErrorMsg('');
      setIsSubmitting(false);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, procedureToEdit]);

  if (!isOpen) return null;

  const parsedDuration = parseInt(duration, 10) || 0;
  const parsedPriceCents = Math.round(parseFloat(priceReais || '0') * 100);
  const parsedCostCents = Math.round(parseFloat(costReais || '0') * 100);
  const estimatedMarginCents = parsedPriceCents - parsedCostCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setErrorMsg('Informe o nome do procedimento.');
      return;
    }

    if (parsedDuration <= 0) {
      setErrorMsg('A duração padrão deve ser maior que zero minutos.');
      return;
    }

    if (parsedPriceCents < 0) {
      setErrorMsg('O preço padrão não pode ser negativo.');
      return;
    }

    if (parsedCostCents < 0) {
      setErrorMsg('O custo operacional não pode ser negativo.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let saved: LocalProcedure;
      if (isEditing && procedureToEdit) {
        saved = await procedureRepo.updateProcedure(procedureToEdit.id, {
          name: name.trim(),
          default_duration_minutes: parsedDuration,
          default_price_cents: parsedPriceCents,
          cost_cents: parsedCostCents,
        });
      } else {
        saved = await procedureRepo.createProcedure({
          tenant_id: tenantId,
          name: name.trim(),
          default_duration_minutes: parsedDuration,
          default_price_cents: parsedPriceCents,
          cost_cents: parsedCostCents,
        });
      }

      onProcedureSaved?.(saved);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar procedimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="procedure-modal-title"
      data-testid="procedure-form-modal"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="procedure-modal-title"
                data-testid="procedure-modal-title"
                className="font-bold text-slate-900 text-base"
              >
                {isEditing ? 'Editar Procedimento' : 'Novo Procedimento'}
              </h3>
              <span className="text-xs text-slate-500">
                {isEditing ? 'Atualize as especificações e tabela' : 'Cadastre um novo serviço odontológico'}
              </span>
            </div>
          </div>
          <button
            type="button"
            data-testid="btn-close-procedure-modal"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div
              data-testid="procedure-form-error"
              className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium"
            >
              {errorMsg}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Procedimento / Serviço <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              data-testid="input-procedure-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Restauração em Resina, Profilaxia, Canal..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition outline-none"
              autoFocus
            />
          </div>

          {/* Duração com presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Duração Estimada (minutos) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(String(mins))}
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                      duration === String(mins)
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                data-testid="input-procedure-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                min="1"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition outline-none"
              />
            </div>
          </div>

          {/* Preço de Tabela e Custo de Insumos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço Cobrado (R$)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  data-testid="input-procedure-price"
                  value={priceReais}
                  onChange={(e) => setPriceReais(e.target.value)}
                  placeholder="150.00"
                  min="0"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition outline-none font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Deixe 0 para cortesia ou avaliação gratuita
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custo Insumos / Lab (R$)
              </label>
              <div className="relative">
                <Coins className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  data-testid="input-procedure-cost"
                  value={costReais}
                  onChange={(e) => setCostReais(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition outline-none font-mono"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Materiais clínicos ou laboratório protético
              </span>
            </div>
          </div>

          {/* Estimativa de Margem Bruta */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Margem Bruta Estimada
            </span>
            <span
              data-testid="procedure-margin-preview"
              className={`text-sm font-bold font-mono ${
                estimatedMarginCents >= 0 ? 'text-teal-700' : 'text-rose-600'
              }`}
            >
              R$ {(estimatedMarginCents / 100).toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Rodapé / Ações */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              data-testid="btn-cancel-procedure"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-save-procedure"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-xl shadow-xs transition"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Procedimento' : 'Cadastrar Procedimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
