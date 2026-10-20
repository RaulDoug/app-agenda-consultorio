import React from 'react';
import { AlertTriangle, LogOut, X } from 'lucide-react';

export interface LogoutConfirmDrawerProps {
  isOpen: boolean;
  pendingCount: number;
  onConfirmLogout: () => void;
  onClose: () => void;
}

export const LogoutConfirmDrawer: React.FC<LogoutConfirmDrawerProps> = ({
  isOpen,
  pendingCount,
  onConfirmLogout,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      data-testid="logout-confirm-drawer"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn"
    >
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Conteúdo da Gaveta */}
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border-t sm:border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-red-600">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Encerrar Sessão</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            Deseja realmente sair da sua conta neste dispositivo?
          </p>

          {pendingCount > 0 ? (
            <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Atenção: {pendingCount} alterações pendentes</p>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  Existem alterações gravadas offline que ainda não foram enviadas ao servidor. Ao sair, a base local será limpa e essas modificações serão perdidas.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">
              Todas as suas alterações estão sincronizadas. A base local será limpa com segurança.
            </p>
          )}
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            data-testid="btn-confirm-logout"
            onClick={onConfirmLogout}
            className="w-full min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm shadow-md shadow-red-700/20 flex items-center justify-center space-x-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair e Limpar Dados</span>
          </button>

          <button
            type="button"
            data-testid="btn-cancel-logout"
            onClick={onClose}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 font-semibold text-xs flex items-center justify-center transition-all"
          >
            Cancelar e Continuar Conectado
          </button>
        </div>
      </div>
    </div>
  );
};
