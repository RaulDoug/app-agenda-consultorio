import React from 'react';
import { DESKTOP_NAV_ITEMS, type NavTabId } from './BottomNav.js';
import { MessageSquare, RefreshCw, Activity } from 'lucide-react';

interface DesktopSidebarProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  clinicName?: string;
  whatsappConnected?: boolean;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  clinicName = 'Clínica Sorriso & Saúde',
  whatsappConnected = true,
  onManualSync,
  isSyncing = false,
}) => {
  return (
    <aside
      data-testid="desktop-sidebar"
      className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0 select-none"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
          <Activity className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900">CliniAssist</h1>
          <p className="text-xs text-slate-500 truncate" title={clinicName}>
            {clinicName}
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {DESKTOP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              data-testid={`sidebar-tab-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-teal-700 stroke-[2.5]' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Status Section */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
        {/* WhatsApp Session Indicator */}
        <div
          data-testid="whatsapp-status-indicator"
          className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-white border border-slate-200"
        >
          <div className="flex items-center space-x-2 truncate">
            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-700 font-medium truncate">WhatsApp</span>
          </div>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
              whatsappConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {whatsappConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Sync Button */}
        {onManualSync && (
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
