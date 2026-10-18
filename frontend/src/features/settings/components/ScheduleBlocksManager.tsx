import React, { useState, useEffect } from 'react';
import { SettingsLocalRepository, settingsRepo as defaultRepo } from '../../../db/repositories/settings-local-repository.js';
import type { LocalScheduleBlock } from '../../../db/types.js';
import { CalendarX, Plus, Trash2, Clock } from 'lucide-react';

interface ScheduleBlocksManagerProps {
  tenantId?: string;
  repo?: SettingsLocalRepository;
}

export const ScheduleBlocksManager: React.FC<ScheduleBlocksManagerProps> = ({
  tenantId = 'tenant-default',
  repo = defaultRepo,
}) => {
  const [blocks, setBlocks] = useState<LocalScheduleBlock[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadBlocks = async () => {
    const list = await repo.getActiveScheduleBlocks(tenantId);
    setBlocks(list);
  };

  useEffect(() => {
    loadBlocks();
  }, [tenantId]);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;

    setIsLoading(true);
    try {
      await repo.createScheduleBlock({
        tenant_id: tenantId,
        title,
        start_time: startTime,
        end_time: endTime,
      });
      setTitle('');
      setStartTime('');
      setEndTime('');
      setIsAdding(false);
      await loadBlocks();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    await repo.deleteScheduleBlock(id);
    await loadBlocks();
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div data-testid="schedule-blocks-manager" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarX className="w-5 h-5 text-teal-700" />
          <h3 className="font-bold text-slate-800 text-base">Bloqueios de Agenda</h3>
        </div>
        <button
          type="button"
          data-testid="btn-toggle-add-block"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'Cancelar' : 'Novo Bloqueio'}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Bloqueie períodos específicos como feriados, treinamentos, férias ou reformas para impedir agendamentos.
      </p>

      {isAdding && (
        <form
          data-testid="form-add-schedule-block"
          onSubmit={handleAddBlock}
          className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Cadastrar Bloqueio</h4>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Motivo / Título</label>
            <input
              type="text"
              data-testid="input-block-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Feriado Nacional, Reunião da Equipe"
              required
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data/Hora de Início</label>
              <input
                type="datetime-local"
                data-testid="input-block-start"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data/Hora de Término</label>
              <input
                type="datetime-local"
                data-testid="input-block-end"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-save-schedule-block"
              disabled={isLoading || !title || !startTime || !endTime}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg shadow-xs"
            >
              {isLoading ? 'Salvando...' : 'Salvar Bloqueio'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de bloqueios */}
      <div data-testid="blocks-list" className="space-y-2">
        {blocks.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
            Nenhum bloqueio cadastrado no momento.
          </div>
        ) : (
          blocks.map((b) => (
            <div
              key={b.id}
              data-testid={`schedule-block-item-${b.id}`}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
            >
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 text-sm block">{b.title}</span>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {formatDateTime(b.start_time)} até {formatDateTime(b.end_time)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                data-testid={`btn-delete-block-${b.id}`}
                onClick={() => handleDeleteBlock(b.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remover bloqueio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
