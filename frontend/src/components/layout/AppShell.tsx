import React from 'react';
import { DesktopSidebar } from './DesktopSidebar.js';
import { BottomNav, type NavTabId } from './BottomNav.js';
import { TopBar, type ConnectionState } from './TopBar.js';
import { WhatsAppAlertBanner } from '../../features/analytics/components/WhatsAppAlertBanner.js';

export interface AppShellProps {
  children?: React.ReactNode;
  activeTab?: NavTabId;
  onTabChange?: (tab: NavTabId) => void;
  onQuickAppointment?: () => void;
  clinicName?: string;
  connectionStatus?: ConnectionState;
  whatsappConnected?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeTab = 'agenda',
  onTabChange = () => {},
  onQuickAppointment,
  clinicName = 'CliniAssist',
  connectionStatus = 'ONLINE',
  whatsappConnected = true,
}) => {
  return (
    <div data-testid="app-shell" className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar (visível apenas em md+) */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        clinicName={clinicName}
        whatsappConnected={whatsappConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          clinicName={clinicName}
          connectionStatus={connectionStatus}
        />

        {!whatsappConnected && (
          <WhatsAppAlertBanner
            isConnected={false}
            onConnectClick={() => onTabChange('ajustes')}
          />
        )}

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation (visível apenas em telas menores que md) */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={onTabChange}
          onQuickAppointment={onQuickAppointment}
        />
      </div>
    </div>
  );
};
