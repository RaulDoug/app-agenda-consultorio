import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import { AuthProvider } from './features/auth/hooks/AuthContext.js';
import { AuthGate } from './features/auth/components/AuthGate.js';
import { useAuth } from './features/auth/hooks/useAuth.js';
import './index.css';

const AuthenticatedApp: React.FC = () => {
  const { session, apiClient, logout } = useAuth();
  return (
    <App
      session={session}
      apiClient={apiClient}
      onLogout={logout}
      tenantId={session?.tenant?.id}
    />
  );
};

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <AuthGate>
          <AuthenticatedApp />
        </AuthGate>
      </AuthProvider>
    </React.StrictMode>
  );
}

// Registro do Service Worker para suporte PWA Offline-First (AC-196)
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => {
        console.log('[PWA] Service Worker registrado com escopo:', reg.scope);
        reg.update().catch(() => {});
      },
      (err) => {
        console.warn('[PWA] Falha ao registrar Service Worker:', err);
      }
    );
  });
}
