import React from 'react';
import { ViewMode } from '../types';

interface ViewModeSelectorProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrevDate,
  onNextDate,
  onToday,
}) => {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(currentDate);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      {/* Navegação de Data */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevDate}
          aria-label="Data anterior"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToday}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition active:scale-95"
        >
          Hoje
        </button>

        <button
          type="button"
          onClick={onNextDate}
          aria-label="Próxima data"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <span className="ml-2 font-medium text-slate-800 text-sm sm:text-base capitalize">
          {formattedDate}
        </span>
      </div>

      {/* Seletor de Modo de Visualização (Dia padrão, Semana, Mês) */}
      <div className="flex items-center bg-slate-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => onViewModeChange('day')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
            viewMode === 'day'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={viewMode === 'day'}
        >
          Dia
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('week')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
            viewMode === 'week'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={viewMode === 'week'}
        >
          Semana
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('month')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
            viewMode === 'month'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={viewMode === 'month'}
        >
          Mês
        </button>
      </div>
    </div>
  );
};
