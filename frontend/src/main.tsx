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
