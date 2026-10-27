import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthenticatedApp } from './App.js';
import { AuthProvider } from './features/auth/hooks/AuthContext.js';
import { AuthGate } from './features/auth/components/AuthGate.js';
import './index.css';

type RootContainerElement = HTMLElement & {
  _reactRoot?: ReactDOM.Root;
};

export function mountApp(container: HTMLElement | null): ReactDOM.Root | null {
  if (!container) return null;

  const rootContainer = container as RootContainerElement;
  if (!rootContainer._reactRoot) {
    rootContainer._reactRoot = ReactDOM.createRoot(rootContainer);
  }

  rootContainer._reactRoot.render(
    <React.StrictMode>
      <AuthProvider>
        <AuthGate>
          <AuthenticatedApp />
        </AuthGate>
      </AuthProvider>
    </React.StrictMode>
  );

  return rootContainer._reactRoot;
}

// Inicialização idempotente da raiz da aplicação
mountApp(document.getElementById('root'));

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
