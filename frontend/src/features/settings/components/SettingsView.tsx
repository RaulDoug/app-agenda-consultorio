import React, { useState, useEffect } from 'react';
import { SettingsLocalRepository, settingsRepo as defaultRepo, type BusinessHoursInput } from '../../../db/repositories/settings-local-repository.js';
import type { LocalBusinessHours } from '../../../db/types.js';
import { ScheduleBlocksManager } from './ScheduleBlocksManager.js';
import { WhatsAppPairingView } from '../../analytics/components/WhatsAppPairingView.js';
import { Clock, Check, Save } from 'lucide-react';

const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

interface SettingsViewProps {
  tenantId?: string;
  repo?: SettingsLocalRepository;
  whatsappConnected?: boolean;
  onRefreshWhatsApp?: () => Promise<void>;
  onDisconnectWhatsApp?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  tenantId = 'tenant-default',
  repo = defaultRepo,
  whatsappConnected = true,
  onRefreshWhatsApp,
  onDisconnectWhatsApp,
}) => {
  const [hours, setHours] = useState<LocalBusinessHours[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    repo.getBusinessHours(tenantId).then((data) => {
      if (isMounted) setHours(data);
    });
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const handleToggleDay = (dayOfWeek: number) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayOfWeek ? { ...h, is_open: !h.is_open } : h
      )
    );
  };

  const handleChangeField = (
    dayOfWeek: number,
    field: 'start_time' | 'end_time' | 'break_start_time' | 'break_end_time',
    value: string
  ) => {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayOfWeek
          ? { ...h, [field]: value === '' ? null : value }
          : h
      )
    );
  };

  const handleSaveHours = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const inputs: BusinessHoursInput[] = hours.map((h) => ({
        id: h.id,
        tenant_id: tenantId,
        day_of_week: h.day_of_week,
        is_open: h.is_open,
        start_time: h.start_time,
        end_time: h.end_time,
        break_start_time: h.break_start_time,
        break_end_time: h.break_end_time,
      }));

      const updated = await repo.saveBusinessHours(inputs);
      setHours(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div data-testid="settings-view" className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Ajustes do Consultório</h2>
        <p className="text-xs text-slate-500">
          Configure seu horário de expediente regular, pausas de almoço, bloqueios e integração de comunicação.
        </p>
      </div>

      {/* Seção 1: Expediente Semanal */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-slate-800 text-base">Expediente Regular & Intervalos</h3>
          </div>
          <button
            type="button"
            data-testid="btn-save-business-hours"
            onClick={handleSaveHours}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Gravando...' : 'Salvar Expediente'}</span>
              </>
            )}
          </button>
        </div>

        {saveSuccess && (
          <div
            data-testid="business-hours-success-banner"
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-medium"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            Expediente semanal atualizado com sucesso e sincronizado no banco local!
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {hours.map((h) => {
            const dayName = DAY_NAMES[h.day_of_week];
            return (
              <div
                key={h.day_of_week}
                data-testid={`business-hours-row-${h.day_of_week}`}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-3 w-40">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid={`toggle-open-${h.day_of_week}`}
                      checked={h.is_open}
                      onChange={() => handleToggleDay(h.day_of_week)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
                  </label>
                  <span className={`font-semibold ${h.is_open ? 'text-slate-800' : 'text-slate-400'}`}>
                    {dayName}
                  </span>
                </div>

                {h.is_open ? (
                  <div className="flex-1 flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Expediente:</span>
                      <input
                        type="time"
                        data-testid={`input-start-${h.day_of_week}`}
                        value={h.start_time}
                        onChange={(e) => handleChangeField(h.day_of_week, 'start_time', e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-teal-600 focus:outline-none"
                      />
                      <span className="text-slate-400">às</span>
                      <input
                        type="time"
                        data-testid={`input-end-${h.day_of_week}`}
                        value={h.end_time}
                        onChange={(e) => handleChangeField(h.day_of_week, 'end_time', e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-teal-600 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Almoço:</span>
                      <input
                        type="time"
                        data-testid={`input-break-start-${h.day_of_week}`}
                        value={h.break_start_time || ''}
                        onChange={(e) => handleChangeField(h.day_of_week, 'break_start_time', e.target.value)}
                        placeholder="--:--"
                        className="px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-teal-600 focus:outline-none"
                      />
                      <span className="text-slate-400">às</span>
                      <input
                        type="time"
                        data-testid={`input-break-end-${h.day_of_week}`}
                        value={h.break_end_time || ''}
                        onChange={(e) => handleChangeField(h.day_of_week, 'break_end_time', e.target.value)}
                        placeholder="--:--"
                        className="px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-slate-400 italic">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção 2: Bloqueios Pontuais de Agenda */}
      <ScheduleBlocksManager tenantId={tenantId} repo={repo} />

      {/* Seção 3: Conexão WhatsApp */}
      <div className="space-y-2">
        <h3 className="font-bold text-slate-800 text-base">Comunicação e Notificações</h3>
        <WhatsAppPairingView
          isConnected={whatsappConnected}
          onRefreshQrCode={onRefreshWhatsApp}
          onDisconnect={onDisconnectWhatsApp}
        />
      </div>
    </div>
  );
};
