import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell.js';
import { type NavTabId } from './components/layout/BottomNav.js';
import { STATUS_TOKENS } from './theme/tokens.js';
import { Calendar, Users, Wallet, Settings } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTabId>('agenda');

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'agenda' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Timeline da Agenda</h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-200">
              Grade de 30m
            </span>
          </div>

          {/* Cards de Exemplo com Cores Semânticas dos Tokens */}
          <div className="grid gap-3">
            <div className={`p-4 rounded-xl border border-slate-200 bg-white border-l-4 ${STATUS_TOKENS.CONFIRMED.borderClass} shadow-xs`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-teal-700">09:00 - 09:30</span>
                  <h3 className="font-semibold text-slate-900">Maria Silva</h3>
                  <p className="text-xs text-slate-500">Consulta Odontológica / Procedimento</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_TOKENS.CONFIRMED.badgeBg} ${STATUS_TOKENS.CONFIRMED.badgeText}`}>
                  {STATUS_TOKENS.CONFIRMED.label}
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border border-slate-200 bg-white border-l-4 ${STATUS_TOKENS.PENDING.borderClass} shadow-xs`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-700">10:30 - 11:00</span>
                  <h3 className="font-semibold text-slate-900">Carlos Eduardo</h3>
                  <p className="text-xs text-slate-500">Avaliação Geral</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_TOKENS.PENDING.badgeBg} ${STATUS_TOKENS.PENDING.badgeText}`}>
                  {STATUS_TOKENS.PENDING.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clientes' && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Clientes e Pacientes</h2>
          <p className="text-sm text-slate-600">Base unificada de clientes com histórico de consultas e dados de contato.</p>
        </div>
      )}

      {activeTab === 'caixa' && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Caixa e Relatórios</h2>
          <p className="text-sm text-slate-600">Fluxo de recebimentos, DRE simplificado e controle de parcelas.</p>
        </div>
      )}

      {activeTab === 'ajustes' && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Ajustes do Consultório</h2>
          <p className="text-sm text-slate-600">Expediente semanal, bloqueios de agenda e pareamento WhatsApp.</p>
        </div>
      )}
    </AppShell>
  );
};

export default App;
