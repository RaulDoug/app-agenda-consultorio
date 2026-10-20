import React from 'react';
import { Activity, Mail, Lock, Eye, EyeOff, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { useLoginForm } from '../hooks/useLoginForm.js';

export interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  savedEmail?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, savedEmail }) => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    isSubmitting,
    errorMessage,
    isOfflineError,
    fieldErrors,
    handleSubmit,
  } = useLoginForm({
    onLogin,
    initialEmail: savedEmail,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div
      data-testid="login-screen"
      className="min-h-screen bg-slate-900 flex flex-col justify-between sm:justify-center sm:items-center relative overflow-hidden font-sans"
    >
      {/* Background Decorativo com Gradiente Teal */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-teal-700 via-teal-800 to-slate-900 pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Header com Branding no Topo */}
      <div className="relative z-10 pt-10 px-6 sm:px-0 text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shadow-lg shadow-teal-900/30 backdrop-blur-sm mb-3">
          <Activity className="w-8 h-8 text-teal-300 stroke-[2.5]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
          CliniAssist
        </h1>
        <p className="text-xs text-teal-200/80 font-medium tracking-wide mt-0.5">
          Acesso Seguro do Consultório
        </p>
      </div>

      {/* Sheet / Card de Login (Ancorado no rodapé no mobile, card flutuante no desktop) */}
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl border-t border-slate-100 sm:border sm:border-slate-200 mt-6 sm:my-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">Entrar na Conta</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informe as credenciais fornecidas pela administração.
          </p>
        </div>

        {/* Banner de Erro Offline */}
        {isOfflineError && (
          <div
            data-testid="offline-alert-banner"
            role="alert"
            className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900 text-xs"
          >
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Sem conexão com a internet</p>
              <p className="text-amber-700 mt-0.5">
                Para o primeiro acesso, o dispositivo precisa de rede ativa para validar a credencial.
              </p>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="mt-2 text-xs font-bold text-teal-700 hover:text-teal-800 underline block"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Mensagem de Erro Geral da API */}
        {errorMessage && !isOfflineError && (
          <div
            data-testid="error-alert-banner"
            role="alert"
            className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2.5 text-red-900 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="login-email">
              E-mail do Consultório
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                data-testid="input-login-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@odonto.com"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-3.5 py-2.5 min-h-[44px] rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${
                  fieldErrors.email ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="login-password">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                data-testid="input-login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                disabled={isSubmitting}
                className={`w-full pl-10 pr-11 py-2.5 min-h-[44px] rounded-xl border text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all ${
                  fieldErrors.password ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                data-testid="btn-toggle-password"
                onClick={toggleShowPassword}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 min-w-[44px] justify-center"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-600 mt-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {/* Botão de Envio (One-Thumb na base) */}
          <div className="pt-2">
            <button
              type="submit"
              data-testid="btn-submit-login"
              disabled={isSubmitting}
              className="w-full min-h-[44px] rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Validando credenciais...</span>
                </>
              ) : (
                <span>Entrar no Consultório</span>
              )}
            </button>
          </div>
        </form>

        {/* Rodapé Informativo */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Dúvidas ou reset de acesso? Contate o suporte técnico.</p>
        </div>
      </div>
    </div>
  );
};
