import React from 'react';
import { Activity } from 'lucide-react';

export const SessionSplash: React.FC = () => {
  return (
    <div
      data-testid="session-splash"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white select-none animate-fadeIn"
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Ícone Pulsante */}
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shadow-lg shadow-teal-900/40 backdrop-blur-sm animate-pulse">
          <Activity className="w-9 h-9 text-teal-300 stroke-[2.5]" />
        </div>

        {/* Marca e Descrição */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm font-sans">
            CliniAssist
          </h1>
          <p className="text-xs text-teal-200/80 font-medium tracking-wide mt-1">
            Gestão Ágil de Consultórios
          </p>
        </div>
      </div>

      {/* Indicador sutil de carregamento na base */}
      <div className="absolute bottom-10 flex items-center space-x-1.5 opacity-60">
        <div className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};
