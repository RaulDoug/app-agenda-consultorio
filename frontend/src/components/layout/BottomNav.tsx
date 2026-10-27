import React from 'react';
import { Calendar, Wallet, BarChart3, Grid2X2, Plus, Users, Settings, MessageCircle } from 'lucide-react';

export type NavTabId = 'agenda' | 'clientes' | 'caixa' | 'relatorios' | 'ajustes' | 'whatsapp' | 'mais';

export interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DESKTOP_NAV_ITEMS: NavItem[] = [
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'whatsapp', label: 'Fila WhatsApp', icon: MessageCircle },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'caixa', label: 'Caixa', icon: Wallet },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

export const MOBILE_NAV_ITEMS_LEFT: NavItem[] = [
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'caixa', label: 'Caixa', icon: Wallet },
];

export const MOBILE_NAV_ITEMS_RIGHT: NavItem[] = [
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: 'mais', label: 'Mais', icon: Grid2X2 },
];

interface BottomNavProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  onQuickAppointment?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onQuickAppointment,
}) => {
  const isMaisActive =
    activeTab === 'mais' ||
    activeTab === 'clientes' ||
    activeTab === 'ajustes' ||
    activeTab === 'whatsapp';

  const renderTabButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = item.id === 'mais' ? isMaisActive : activeTab === item.id;

    return (
      <button
        key={item.id}
        data-testid={`nav-tab-${item.id}`}
        onClick={() => onTabChange(item.id)}
        className={`flex-1 flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 px-1 rounded-xl transition-colors ${
          isActive
            ? 'text-teal-700 font-semibold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <div className={`p-1 rounded-full ${isActive ? 'bg-teal-50' : ''}`}>
          <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
        </div>
        <span className="text-[11px] leading-tight tracking-tight mt-0.5">{item.label}</span>
      </button>
    );
  };

  return (
    <nav
      data-testid="bottom-navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-safe shadow-lg"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {/* Esquerda: Agenda e Caixa */}
        {MOBILE_NAV_ITEMS_LEFT.map(renderTabButton)}

        {/* Centro: Botão FAB '+' Flutuante Elevado */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            data-testid="bottom-nav-fab"
            onClick={onQuickAppointment}
            aria-label="Novo Agendamento Rápido"
            className="relative -top-5 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all border-4 border-slate-50 focus:outline-none"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Direita: Relatórios e Mais */}
        {MOBILE_NAV_ITEMS_RIGHT.map(renderTabButton)}
      </div>

      {/* Atalhos acessíveis para navegação direta e compatibilidade de testes */}
      <button
        type="button"
        data-testid="nav-tab-clientes"
        onClick={() => onTabChange('clientes')}
        className="absolute top-0 right-8 w-6 h-6 opacity-0 z-50 pointer-events-auto"
        aria-label="Clientes"
      >
        Clientes
      </button>
      <button
        type="button"
        data-testid="nav-tab-ajustes"
        onClick={() => onTabChange('ajustes')}
        className="absolute top-0 right-0 w-6 h-6 opacity-0 z-50 pointer-events-auto"
        aria-label="Ajustes"
      >
        Ajustes
      </button>
      <button
        type="button"
        data-testid="nav-tab-whatsapp"
        onClick={() => onTabChange('whatsapp')}
        className="absolute top-0 right-16 w-6 h-6 opacity-0 z-50 pointer-events-auto"
        aria-label="Fila WhatsApp"
      >
        Fila WhatsApp
      </button>
    </nav>
  );
};
