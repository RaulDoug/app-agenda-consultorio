import React from 'react';
import { NavTabId } from './BottomNav';
import { Users, Settings, ChevronRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';

interface MoreMenuHubProps {
  onSelectSection: (tab: NavTabId) => void;
  patientCount?: number;
  procedureCount?: number;
}

export const MoreMenuHub: React.FC<MoreMenuHubProps> = ({
  onSelectSection,
  patientCount = 0,
  procedureCount = 0,
}) => {
  return (
    <div className="space-y-6" data-testid="more-menu-hub">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Mais Recursos</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Acesse a central de mensagens, catálogo de serviços, base de clientes e ajustes da clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card Fila de WhatsApp */}
        <button
          type="button"
          data-testid="more-card-whatsapp"
          onClick={() => onSelectSection('whatsapp')}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-xs transition text-left group sm:col-span-2"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageCircle className="w-6 h-6 stroke-2" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Fila de Envios WhatsApp
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                  Automação
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhe confirmações, edite mensagens, reordene a fila e faça envios manuais.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition" />
        </button>

        {/* Card Procedimentos & Serviços */}
        <button
          type="button"
          data-testid="more-card-procedimentos"
          onClick={() => onSelectSection('procedimentos')}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-xs transition text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6 stroke-2" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Procedimentos & Serviços
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                  Catálogo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {procedureCount} {procedureCount === 1 ? 'procedimento cadastrado' : 'procedimentos cadastrados'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition" />
        </button>

        {/* Card Clientes */}
        <button
          type="button"
          data-testid="more-card-clientes"
          onClick={() => onSelectSection('clientes')}
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-xs transition text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
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
          className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-teal-500 hover:shadow-xs transition text-left group sm:col-span-2"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Settings className="w-6 h-6 stroke-2" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Ajustes & Conexão
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
        <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0" />
        <span>
          Seus dados operam no modo <strong>Local-First</strong> com criptografia de ponta a ponta e
          sincronização automática com a nuvem.
        </span>
      </div>
    </div>
  );
};
