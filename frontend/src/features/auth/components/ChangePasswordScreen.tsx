import React from 'react';
import { Lock, KeyRound, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useChangePasswordForm } from '../hooks/useChangePasswordForm.js';

export interface ChangePasswordScreenProps {
  onChangePassword: (current: string, next: string) => Promise<void>;
  onCancel: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  onChangePassword,
  onCancel,
}) => {
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPasswords,
    toggleShowPasswords,
    isSubmitting,
    errorMessage,
    fieldErrors,
    handleSubmit,
  } = useChangePasswordForm({
    onChangePassword,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div
      data-testid="change-password-screen"
      className="min-h-screen bg-slate-900 flex flex-col justify-between sm:justify-center sm:items-center relative overflow-hidden font-sans"
    >
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-teal-700 via-teal-800 to-slate-900 pointer-events-none" />

      {/* Topo com Identificação */}
      <div className="relative z-10 pt-10 px-6 sm:px-0 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-900/30 backdrop-blur-sm mb-3">
          <KeyRound className="w-8 h-8 text-amber-300 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
          Troca Obrigatória de Senha
        </h1>
        <p className="text-xs text-amber-200/90 font-medium tracking-wide mt-0.5">
          Primeiro acesso ou credencial temporária redefinida
        </p>
      </div>

      {/* Sheet / Card */}
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-slate-100 sm:border sm:border-slate-200 mt-6 sm:my-8">
        <div className="mb-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Por motivos de segurança, você deve cadastrar uma nova senha pessoal antes de acessar os dados do consultório.
          </p>
          <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-0.5">
            <p className="font-semibold text-slate-700">Requisitos da nova senha:</p>
            <p>• Mínimo de 8 caracteres</p>
            <p>• Ao menos 1 letra e 1 número</p>
            <p>• Diferente da senha temporária atual</p>
          </div>
        </div>

        {/* Mensagem de Erro Geral */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-red-900 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* Senha Atual */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="current-password">
              Senha Temporária Atual
            </label>
            <div className="relative">
              <input
                id="current-password"
                data-testid="input-current-password"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha recebida"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${
                  fieldErrors.currentPassword ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {fieldErrors.currentPassword && (
              <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.currentPassword}</p>
            )}
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="new-password">
              Nova Senha
            </label>
            <div className="relative">
              <input
                id="new-password"
                data-testid="input-new-password"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres com letras e números"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${
                  fieldErrors.newPassword ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {fieldErrors.newPassword && (
              <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.newPassword}</p>
            )}
          </div>

          {/* Confirmação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="confirm-password">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                data-testid="input-confirm-password"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                disabled={isSubmitting}
                className={`w-full px-3.5 py-2.5 min-h-[44px] rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${
                  fieldErrors.confirmPassword ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Alternância de Visibilidade */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={toggleShowPasswords}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center space-x-1.5 py-1"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPasswords ? 'Ocultar senhas' : 'Exibir senhas'}</span>
            </button>
          </div>

          {/* Botão de Envio */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              data-testid="btn-submit-change-password"
              disabled={isSubmitting}
              className="w-full min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Salvando nova senha...</span>
                </>
              ) : (
                <span>Atualizar Senha e Acessar</span>
              )}
            </button>

            {/* Botão de Voltar para o Login */}
            <button
              type="button"
              data-testid="btn-back-to-login"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para o Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
