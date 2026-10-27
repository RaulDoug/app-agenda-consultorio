import React from 'react';
import { ViewMode } from '../types';
import { formatAgendaPeriod, formatAppointmentsCount } from '../utils/date-formatters';

interface ViewModeSelectorProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
  appointmentsCount?: number;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrevDate,
  onNextDate,
  onToday,
  appointmentsCount,
}) => {
  const formattedPeriod = formatAgendaPeriod(currentDate, viewMode);
  const todayButtonLabel =
    viewMode === 'week' ? 'Esta semana' : viewMode === 'month' ? 'Este mês' : 'Hoje';

  return (
    <div className="flex flex-col items-center gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
      {/* 1. Topo: Navegação rápida com setas maiores e seletor contextual ergonômico para mobile */}
      <div className="flex items-center justify-center gap-3 w-full">
        <button
          type="button"
          onClick={onPrevDate}
          aria-label="Data anterior"
          className="min-w-[42px] min-h-[42px] p-2.5 sm:p-3 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 transition shadow-2xs"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onToday}
          data-testid="btn-today-range"
          className="min-h-[42px] px-5 sm:px-6 py-2 text-sm sm:text-base font-bold rounded-xl bg-teal-50 text-teal-800 border border-teal-200/70 hover:bg-teal-100 transition active:scale-95 shadow-2xs"
        >
          {todayButtonLabel}
        </button>

        <button
          type="button"
          onClick={onNextDate}
          aria-label="Próxima data"
          className="min-w-[42px] min-h-[42px] p-2.5 sm:p-3 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 transition shadow-2xs"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 2. Meio: Identificação do dia/semana/mês e contador de atendimentos */}
      <div className="flex flex-col items-center text-center px-2">
        <span
          data-testid="agenda-period-label"
          className="font-bold text-slate-800 text-base sm:text-lg leading-snug"
        >
          {formattedPeriod}
        </span>
        {typeof appointmentsCount === 'number' && (
          <span
            data-testid="agenda-appointments-count"
            className="text-xs sm:text-sm text-slate-500 font-medium leading-tight mt-0.5"
          >
            {formatAppointmentsCount(appointmentsCount)}
          </span>
        )}
      </div>

      {/* 3. Abaixo: Seletor de Modo de Visualização (Dia, Semana, Mês) */}
      <div className="flex items-center justify-center bg-slate-100 p-1.5 rounded-xl w-full max-w-xs sm:max-w-sm">
        <button
          type="button"
          onClick={() => onViewModeChange('day')}
          className={`flex-1 min-h-[42px] py-2 px-3 text-sm sm:text-base font-bold rounded-lg transition active:scale-95 text-center flex items-center justify-center ${
            viewMode === 'day'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={viewMode === 'day'}
        >
          Dia
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('week')}
          className={`flex-1 min-h-[42px] py-2 px-3 text-sm sm:text-base font-bold rounded-lg transition active:scale-95 text-center flex items-center justify-center ${
            viewMode === 'week'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-pressed={viewMode === 'week'}
        >
          Semana
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('month')}
          className={`flex-1 min-h-[42px] py-2 px-3 text-sm sm:text-base font-bold rounded-lg transition active:scale-95 text-center flex items-center justify-center ${
            viewMode === 'month'
              ? 'bg-white text-teal-800 shadow-xs'
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
