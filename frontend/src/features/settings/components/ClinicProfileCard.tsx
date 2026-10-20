import React from 'react';
import { Building2, Mail, LogOut } from 'lucide-react';

export interface ClinicProfileCardProps {
  tenantName?: string;
  tenantEmail?: string | null;
  onRequestLogout: () => void;
}

export const ClinicProfileCard: React.FC<ClinicProfileCardProps> = ({
  tenantName = 'Consultório',
  tenantEmail,
  onRequestLogout,
}) => {
  return (
    <div
      data-testid="clinic-profile-card"
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Informações da Conta */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-teal-700" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full inline-block mb-1">
              Consultório Ativo
            </span>
            <h2 className="text-base font-bold text-slate-900 truncate">
              {tenantName}
            </h2>
            {tenantEmail && (
              <p className="text-xs text-slate-500 flex items-center space-x-1.5 truncate mt-0.5">
                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{tenantEmail}</span>
              </p>
            )}
          </div>
        </div>

        {/* Botão Sair da Conta (One-Thumb / Mobile Friendly) */}
        <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            type="button"
            data-testid="btn-request-logout"
            onClick={onRequestLogout}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl border border-red-200 text-red-700 hover:bg-red-50 active:bg-red-100 font-bold text-xs flex items-center justify-center space-x-2 transition-all"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
