import React, { useState } from 'react';
import {
  Send,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle,
  Pause,
  Play,
  Settings,
  GripVertical,
  Clock,
  AlertCircle,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import type { WhatsappQueueItem, WhatsappQueueItemCategory } from '@cliniassist/shared';
import { useWhatsappQueue, type DateFilterPreset } from '../hooks/useWhatsappQueue.js';
import { EditQueueMessageDrawer } from './EditQueueMessageDrawer.js';
import { WhatsappTemplatesDrawer } from './WhatsappTemplatesDrawer.js';

interface WhatsappQueueViewProps {
  token?: string;
}

export const WhatsappQueueView: React.FC<WhatsappQueueViewProps> = ({ token }) => {
  const queueData = useWhatsappQueue(token);
  const items = queueData?.items || [];
  const counts = queueData?.counts || {
    total: 0,
    pending_queue: 0,
    awaiting_reply: 0,
    confirmed: 0,
    reschedule_requested: 0,
    human_attention: 0,
  };
  const queuePaused = queueData?.queuePaused || false;
  const loading = queueData?.loading || false;
  const error = queueData?.error || null;
  const dateFilter = queueData?.dateFilter || 'today';
  const setDateFilter = queueData?.setDateFilter || (() => {});
  const categoryFilter = queueData?.categoryFilter || 'ALL';
  const setCategoryFilter = queueData?.setCategoryFilter || (() => {});
  const settings = queueData?.settings || null;
  const sendNow = queueData?.sendNow || (async () => {});
  const exclude = queueData?.exclude || (async () => {});
  const updateMessage = queueData?.updateMessage || (async () => {});
  const reorder = queueData?.reorder || (async () => {});
  const togglePause = queueData?.togglePause || (async () => {});
  const triggerBatch = queueData?.triggerBatch || (async () => {});
  const saveSettings = queueData?.saveSettings || (async () => {});
  const resolveStatus = queueData?.resolveStatus || (async () => {});

  const [editingItem, setEditingItem] = useState<WhatsappQueueItem | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newOrder = [...items];
    const [moved] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    const orderedIds = newOrder.map((i) => i.appointment_id);
    setDraggedIndex(null);
    await reorder(orderedIds);
  };

  const renderBadge = (category: WhatsappQueueItemCategory) => {
    switch (category) {
      case 'CONFIRMED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Confirmado
          </span>
        );
      case 'RESCHEDULE_REQUESTED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pediu Reagendamento
          </span>
        );
      case 'HUMAN_ATTENTION':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            Atenção Humana
          </span>
        );
      case 'AWAITING_REPLY':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Enviado — Aguardando
          </span>
        );
      case 'PENDING_QUEUE':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Na Fila
          </span>
        );
    }
  };

  return (
    <div data-testid="whatsapp-queue-view" className="space-y-5 max-w-4xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-teal-600" />
            Central de Envios & Confirmações WhatsApp
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie os envios automáticos, personalize mensagens e acompanhe respostas de pacientes.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            data-testid="btn-toggle-pause"
            onClick={togglePause}
            className={`px-3 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 border transition-colors min-h-[44px] ${
              queuePaused
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {queuePaused ? <Play className="w-4 h-4 fill-amber-700" /> : <Pause className="w-4 h-4" />}
            {queuePaused ? 'Retomar Fila' : 'Pausar Fila'}
          </button>

          <button
            type="button"
            data-testid="btn-trigger-batch-now"
            onClick={triggerBatch}
            className="px-3.5 py-2 text-xs font-semibold bg-teal-700 text-white rounded-xl hover:bg-teal-800 shadow-xs inline-flex items-center gap-1.5 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 text-teal-200" />
            Disparar Fila Agora
          </button>

          <button
            type="button"
            data-testid="btn-open-templates"
            onClick={() => setIsTemplatesOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Configurar Templates"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Presets */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl w-fit">
        {(['today', 'tomorrow', 'week'] as DateFilterPreset[]).map((preset) => {
          const labels: Record<DateFilterPreset, string> = {
            today: 'Hoje',
            tomorrow: 'Amanhã',
            week: 'Próximos 7 dias',
          };
          const isActive = dateFilter === preset;
          return (
            <button
              key={preset}
              type="button"
              data-testid={`btn-date-filter-${preset}`}
              onClick={() => setDateFilter(preset)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all min-h-[40px] ${
                isActive ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {labels[preset]}
            </button>
          );
        })}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          data-testid="pill-filter-all"
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1.5 rounded-full font-semibold border min-h-[38px] ${
            categoryFilter === 'ALL'
              ? 'bg-slate-800 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos ({counts.total})
        </button>
        <button
          type="button"
          data-testid="pill-filter-pending"
          onClick={() => setCategoryFilter('PENDING_QUEUE')}
          className={`px-3 py-1.5 rounded-full font-semibold border min-h-[38px] ${
            categoryFilter === 'PENDING_QUEUE'
              ? 'bg-slate-800 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Na Fila ({counts.pending_queue})
        </button>
        <button
          type="button"
          data-testid="pill-filter-awaiting"
          onClick={() => setCategoryFilter('AWAITING_REPLY')}
          className={`px-3 py-1.5 rounded-full font-semibold border min-h-[38px] ${
            categoryFilter === 'AWAITING_REPLY'
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white border-slate-200 text-blue-700 hover:bg-blue-50'
          }`}
        >
          Aguardando Resposta ({counts.awaiting_reply})
        </button>
        <button
          type="button"
          data-testid="pill-filter-confirmed"
          onClick={() => setCategoryFilter('CONFIRMED')}
          className={`px-3 py-1.5 rounded-full font-semibold border min-h-[38px] ${
            categoryFilter === 'CONFIRMED'
              ? 'bg-emerald-600 border-emerald-600 text-white'
              : 'bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Confirmados ({counts.confirmed})
        </button>
        <button
          type="button"
          data-testid="pill-filter-reschedule"
          onClick={() => setCategoryFilter('RESCHEDULE_REQUESTED')}
          className={`px-3 py-1.5 rounded-full font-semibold border min-h-[38px] ${
            categoryFilter === 'RESCHEDULE_REQUESTED'
              ? 'bg-amber-600 border-amber-600 text-white'
              : 'bg-white border-slate-200 text-amber-700 hover:bg-amber-50'
          }`}
        >
          Pediu Reagendamento ({counts.reschedule_requested})
        </button>
        <button
          type="button"
          data-testid="pill-filter-attention"
          onClick={() => setCategoryFilter('HUMAN_ATTENTION')}
          className={`px-3 py-1.5 rounded-full font-semibold border min-h-[38px] ${
            categoryFilter === 'HUMAN_ATTENTION'
              ? 'bg-rose-600 border-rose-600 text-white'
              : 'bg-white border-slate-200 text-rose-700 hover:bg-rose-50'
          }`}
        >
          Atenção Humana ({counts.human_attention})
        </button>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          Carregando fila de envios...
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          Nenhum agendamento encontrado para o filtro selecionado.
        </div>
      ) : (
        <div className="space-y-3" data-testid="queue-items-container">
          {items.map((item, index) => {
            const d = new Date(item.appointment_start_time);
            const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const cleanPhone = item.phone.replace(/\D/g, '');
            const waLink = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}`;

            return (
              <div
                key={item.appointment_id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                data-testid={`queue-card-${item.appointment_id}`}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      title="Arraste para reordenar"
                      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          {item.patient_name}
                        </h4>
                        {renderBadge(item.queue_category)}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="font-mono">{item.phone}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {dateStr} às {timeStr}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Ações principais */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      data-testid={`btn-send-now-${item.appointment_id}`}
                      onClick={() => sendNow(item.appointment_id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl inline-flex items-center gap-1 min-h-[44px]"
                      title="Enviar mensagem agora"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Enviar Agora</span>
                    </button>

                    <button
                      type="button"
                      data-testid={`btn-edit-msg-${item.appointment_id}`}
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Editar mensagem"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      data-testid={`btn-exclude-queue-${item.appointment_id}`}
                      onClick={() => exclude(item.appointment_id)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="Remover da fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Preview da Mensagem */}
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Mensagem {item.custom_message ? '(Personalizada)' : '(Padrão)'}
                    </span>
                  </div>
                  <p className="line-clamp-2 italic">{item.preview_message}</p>
                </div>

                {/* Balão de Resposta do Paciente */}
                {item.last_inbound_text && (
                  <div
                    data-testid={`inbound-bubble-${item.appointment_id}`}
                    className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-800 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Última resposta do paciente:
                      </span>
                      {item.last_inbound_at && (
                        <span className="text-[10px] text-amber-600">
                          {new Date(item.last_inbound_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-slate-800 bg-white p-2 rounded-lg border border-amber-100">
                      "{item.last_inbound_text}"
                    </p>

                    {/* Botões de Resolução */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`link-wa-chat-${item.appointment_id}`}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1 min-h-[38px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Responder no WhatsApp
                      </a>

                      <button
                        type="button"
                        data-testid={`btn-resolve-confirm-${item.appointment_id}`}
                        onClick={() => resolveStatus(item.appointment_id, 'CONFIRMED')}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1 min-h-[38px]"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Confirmar Manualmente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Gaveta de Edição de Mensagem Individual */}
      <EditQueueMessageDrawer
        isOpen={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateMessage}
      />

      {/* Gaveta de Templates Padrão */}
      <WhatsappTemplatesDrawer
        isOpen={isTemplatesOpen}
        settings={settings}
        onClose={() => setIsTemplatesOpen(false)}
        onSave={saveSettings}
      />
    </div>
  );
};

