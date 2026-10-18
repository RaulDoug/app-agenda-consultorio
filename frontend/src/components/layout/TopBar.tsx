import React from 'react';
import { Wifi, WifiOff, RefreshCw, Activity } from 'lucide-react';

export type ConnectionState = 'ONLINE' | 'OFFLINE' | 'SYNCING';

interface TopBarProps {
  clinicName?: string;
  connectionStatus?: ConnectionState;
  pendingSyncCount?: number;
  currentDateText?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  clinicName = 'CliniAssist',
  connectionStatus = 'ONLINE',
  pendingSyncCount = 0,
  currentDateText = 'Hoje, 18 de Outubro',
}) => {
  return (
    <header
      data-testid="top-bar"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between"
    >
      {/* Clinic / Mobile Title */}
      <div className="flex items-center space-x-2.5 min-w-0">
        <div className="md:hidden w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
          <Activity className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm md:text-base text-slate-900 truncate">{clinicName}</h2>
          <p className="text-xs text-slate-500 hidden sm:block truncate">{currentDateText}</p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center space-x-2">
        {/* Connection status badge */}
        <div
          data-testid="connection-status-badge"
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            connectionStatus === 'ONLINE'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : connectionStatus === 'SYNCING'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {connectionStatus === 'ONLINE' && (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Online</span>
            </>
          )}
          {connectionStatus === 'SYNCING' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Sincronizando</span>
            </>
          )}
          {connectionStatus === 'OFFLINE' && (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Offline {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
