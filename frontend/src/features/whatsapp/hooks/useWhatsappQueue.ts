import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  WhatsappQueueItem,
  WhatsappQueueListResponse,
  WhatsappQueueItemCategory,
  TenantWhatsappSettings,
  UpdateTenantWhatsappSettingsInput,
} from '@cliniassist/shared';
import { WhatsappQueueApiClient } from '../services/whatsapp-queue-api.js';

export type DateFilterPreset = 'today' | 'tomorrow' | 'week';

export function useWhatsappQueue(token?: string) {
  const api = useMemo(() => new WhatsappQueueApiClient(token), [token]);

  const [dateFilter, setDateFilter] = useState<DateFilterPreset>('today');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<WhatsappQueueListResponse>({
    items: [],
    queue_paused: false,
    pending_jobs_count: 0,
    counts: {
      total: 0,
      pending_queue: 0,
      awaiting_reply: 0,
      confirmed: 0,
      reschedule_requested: 0,
      human_attention: 0,
    },
  });

  const [settings, setSettings] = useState<TenantWhatsappSettings | null>(null);

  const computeDateRange = useCallback((preset: DateFilterPreset) => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    if (preset === 'tomorrow') {
      start.setDate(start.getDate() + 1);
      end.setDate(end.getDate() + 1);
    } else if (preset === 'week') {
      end.setDate(end.getDate() + 7);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, []);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = computeDateRange(dateFilter);
      const res = await api.getQueue(range);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fila.');
    } finally {
      setLoading(false);
    }
  }, [api, dateFilter, computeDateRange]);

  const loadSettings = useCallback(async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch {
      // Ignora erro inicial
    }
  }, [api]);

  useEffect(() => {
    loadQueue();
    loadSettings();
  }, [loadQueue, loadSettings]);

  const handleSendNow = async (appointmentId: string) => {
    await api.sendNow(appointmentId);
    await loadQueue();
  };

  const handleExclude = async (appointmentId: string) => {
    await api.excludeFromQueue(appointmentId);
    await loadQueue();
  };

  const handleUpdateMessage = async (appointmentId: string, message: string | null) => {
    await api.updateMessage(appointmentId, message);
    await loadQueue();
  };

  const handleReorder = async (orderedIds: string[]) => {
    setData((prev) => {
      const map = new Map(prev.items.map((i) => [i.appointment_id, i]));
      const newItems = orderedIds.map((id) => map.get(id)).filter(Boolean) as WhatsappQueueItem[];
      return {
        ...prev,
        items: newItems,
      };
    });
    await api.reorderQueue(orderedIds);
    await loadQueue();
  };

  const handleTogglePause = async () => {
    const newState = !data.queue_paused;
    await api.setQueuePause(newState);
    await loadQueue();
  };

  const handleTriggerBatch = async () => {
    await api.triggerBatch(true);
    await loadQueue();
  };

  const handleSaveSettings = async (input: UpdateTenantWhatsappSettingsInput) => {
    const updated = await api.updateSettings(input);
    setSettings(updated);
    await loadQueue();
  };

  const handleResolveStatus = async (appointmentId: string, status: string) => {
    await api.resolveStatus(appointmentId, status);
    await loadQueue();
  };

  const filteredItems = useMemo(() => {
    if (categoryFilter === 'ALL') return data.items;
    return data.items.filter((item) => item.queue_category === categoryFilter);
  }, [data.items, categoryFilter]);

  return {
    items: filteredItems,
    allItems: data.items,
    counts: data.counts,
    queuePaused: data.queue_paused,
    pendingJobsCount: data.pending_jobs_count,
    loading,
    error,
    dateFilter,
    setDateFilter,
    categoryFilter,
    setCategoryFilter,
    settings,
    refresh: loadQueue,
    sendNow: handleSendNow,
    exclude: handleExclude,
    updateMessage: handleUpdateMessage,
    reorder: handleReorder,
    togglePause: handleTogglePause,
    triggerBatch: handleTriggerBatch,
    saveSettings: handleSaveSettings,
    resolveStatus: handleResolveStatus,
  };
}

