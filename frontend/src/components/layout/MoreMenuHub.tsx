import React from 'react';
import { NavTabId } from './BottomNav';
import { Users, Settings, ChevronRight, Activity, Calendar, ShieldCheck } from 'lucide-react';

interface MoreMenuHubProps {
  onSelectSection: (tab: NavTabId) => void;
  patientCount?: number;
}

export const MoreMenuHub: React.FC<MoreMenuHubProps> = ({
  onSelectSection,
  patientCount = 0,
}) => {
  return (
    <div className="space-y-6" data-testid="more-menu-hub">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Mais Recursos</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Acesse a base de clientes, configurações da clínica e parâmetros do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card Clientes */}
        <button
          type="button"
          data-testid="more-card-clientes"
          onClick={() => onSelectSection('clientes')}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-xs transition text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6 stroke-2" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Clientes & Pacientes
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {patientCount} {patientCount === 1 ? 'paciente cadastrado' : 'pacientes cadastrados'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition" />
        </button>

        {/* Card Ajustes */}
        <button
          type="button"
          data-testid="more-card-ajustes"
          onClick={() => onSelectSection('ajustes')}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-xs transition text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Settings className="w-6 h-6 stroke-2" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Ajustes & WhatsApp
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Horário de expediente, QR Code e dados da clínica
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition" />
        </button>
      </div>

      {/* Info Card / Segurança */}
      <div className="p-4 bg-slate-100/60 rounded-2xl border border-slate-200/80 flex items-center gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
        <span>
          Todos os dados de agendamentos, caixa e pacientes são protegidos e salvos no seu dispositivo com suporte completo a modo offline.
        </span>
      </div>
    </div>
  );
};
