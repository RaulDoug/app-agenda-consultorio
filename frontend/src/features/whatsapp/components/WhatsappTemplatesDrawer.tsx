import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Sparkles,
  Info,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import type { TenantWhatsappSettings, UpdateTenantWhatsappSettingsInput } from '@cliniassist/shared';

interface WhatsappTemplatesDrawerProps {
  isOpen: boolean;
  settings: TenantWhatsappSettings | null;
  onClose: () => void;
  onSave: (input: UpdateTenantWhatsappSettingsInput) => Promise<void>;
}

export function simulateTemplatePreview(template: string): string {
  if (!template) return '';
  return template.replace(/\{([^{}]+)\}/g, (match, content) => {
    if (content === 'nome') return 'Carlos';
    if (content === 'data') return '28/10';
    if (content === 'horario') return '14:30';
    if (content.includes('|')) {
      const parts = content.split('|');
      return parts[0] || '';
    }
    return match;
  });
}

export type TemplateCardKey = 'confirmation' | 'confirmation_reply' | 'reschedule_reply' | 'welcome_fallback';

export const WhatsappTemplatesDrawer: React.FC<WhatsappTemplatesDrawerProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [confirmationMsg, setConfirmationMsg] = useState('');
  const [confirmationReply, setConfirmationReply] = useState('');
  const [rescheduleReply, setRescheduleReply] = useState('');
  const [welcomeFallback, setWelcomeFallback] = useState('');

  const [expandedCard, setExpandedCard] = useState<TemplateCardKey | null>('confirmation');
  const [savingCard, setSavingCard] = useState<TemplateCardKey | null>(null);
  const [savedCard, setSavedCard] = useState<TemplateCardKey | null>(null);

  useEffect(() => {
    if (settings) {
      setConfirmationMsg(settings.confirmation_message_template || '');
      setConfirmationReply(settings.confirmation_reply_template || '');
      setRescheduleReply(settings.reschedule_reply_template || '');
      setWelcomeFallback(settings.welcome_fallback_reply_template || '');
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleToggleCard = (cardKey: TemplateCardKey) => {
    setExpandedCard((prev) => (prev === cardKey ? null : cardKey));
  };

  const handleInsertTag = (setter: React.Dispatch<React.SetStateAction<string>>, tag: string) => {
    setter((prev) => `${prev} ${tag}`.trimStart());
  };

  const handleSaveSingleCard = async (
    cardKey: TemplateCardKey,
    field: keyof UpdateTenantWhatsappSettingsInput,
    value: string
  ) => {
    setSavingCard(cardKey);
    setSavedCard(null);
    try {
      await onSave({
        [field]: value,
      });
      setSavedCard(cardKey);
      setTimeout(() => {
        setSavedCard((prev) => (prev === cardKey ? null : prev));
      }, 3000);
    } finally {
      setSavingCard(null);
    }
  };

  const cards = [
    {
      key: 'confirmation' as TemplateCardKey,
      testId: 'confirmation',
      title: '1. Mensagem de Confirmação (Disparo Inicial)',
      field: 'confirmation_message_template' as keyof UpdateTenantWhatsappSettingsInput,
      value: confirmationMsg,
      setValue: setConfirmationMsg,
      previewLabel: 'Simulação com Carlos • 28/10 às 14:30',
      chips: [
        { label: '+ {nome}', tag: '{nome}', testId: 'btn-insert-nome-confirmation' },
        { label: '+ {data}', tag: '{data}', testId: 'btn-insert-data-confirmation' },
        { label: '+ {horario}', tag: '{horario}', testId: 'btn-insert-horario-confirmation' },
        { label: '+ {Olá|Oi}', tag: '{Olá|Oi|Oi, tudo bem?}', testId: 'btn-insert-spintax-confirmation', isSpintax: true },
      ],
    },
    {
      key: 'confirmation_reply' as TemplateCardKey,
      testId: 'confirmation-reply',
      title: '2. Réplica Automática de Confirmação (Resposta Sim / 1)',
      field: 'confirmation_reply_template' as keyof UpdateTenantWhatsappSettingsInput,
      value: confirmationReply,
      setValue: setConfirmationReply,
      previewLabel: 'Simulação de réplica quando paciente confirma',
      chips: [
        { label: '+ {nome}', tag: '{nome}', testId: 'btn-insert-nome-reply' },
        { label: '+ {data}', tag: '{data}', testId: 'btn-insert-data-reply' },
        { label: '+ {horario}', tag: '{horario}', testId: 'btn-insert-horario-reply' },
        { label: '+ {Perfeito|Ótimo}', tag: '{Perfeito|Ótimo|Combinado}', testId: 'btn-insert-spintax-reply', isSpintax: true },
      ],
    },
    {
      key: 'reschedule_reply' as TemplateCardKey,
      testId: 'reschedule-reply',
      title: '3. Réplica Automática de Reagendamento (Resposta Remarcar / 2)',
      field: 'reschedule_reply_template' as keyof UpdateTenantWhatsappSettingsInput,
      value: rescheduleReply,
      setValue: setRescheduleReply,
      previewLabel: 'Simulação de réplica quando paciente pede remarcação',
      chips: [
        { label: '+ {nome}', tag: '{nome}', testId: 'btn-insert-nome-reschedule' },
        { label: '+ {Recebemos|Entendido}', tag: '{Recebemos seu pedido|Entendido}', testId: 'btn-insert-spintax-reschedule', isSpintax: true },
      ],
    },
    {
      key: 'welcome_fallback' as TemplateCardKey,
      testId: 'welcome-fallback',
      title: '4. Réplica de Acolhimento Humano (Dúvidas, Texto Livre e Áudio)',
      field: 'welcome_fallback_reply_template' as keyof UpdateTenantWhatsappSettingsInput,
      value: welcomeFallback,
      setValue: setWelcomeFallback,
      previewLabel: 'Simulação ao receber dúvida livre ou mensagem de voz',
      chips: [
        { label: '+ {nome}', tag: '{nome}', testId: 'btn-insert-nome-welcome' },
        { label: '+ {Olá|Oi}', tag: '{Olá|Oi|Tudo bem?}', testId: 'btn-insert-spintax-welcome', isSpintax: true },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="whatsapp-templates-drawer"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6 shadow-xl border border-slate-200 animate-in slide-in-from-bottom">
        {/* Header da Gaveta */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Templates Padrão de WhatsApp
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize cada mensagem automática com prévia simulada e salvamento individual.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Informativo com Gabarito de Variáveis e Spintax (AC-227) */}
        <div
          data-testid="templates-cheat-sheet"
          className="mt-4 p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-xs space-y-2.5"
        >
          <div className="flex items-center gap-1.5 font-bold text-teal-900">
            <Info className="w-4 h-4 text-teal-700" />
            <span>Guia de Personalização & Anti-Bloqueio (Gabarito)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
            <div className="bg-white p-2 rounded-xl border border-teal-100 shadow-2xs">
              <span className="font-mono font-semibold text-teal-700">{'{nome}'}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Primeiro nome do paciente (ex.: Carlos)</p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-teal-100 shadow-2xs">
              <span className="font-mono font-semibold text-teal-700">{'{data}'}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Data da consulta (ex.: 28/10)</p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-teal-100 shadow-2xs">
              <span className="font-mono font-semibold text-teal-700">{'{horario}'}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Horário da consulta (ex.: 14:30)</p>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-teal-100 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-teal-800 flex items-center gap-1">
              <span>🔀 Variação de Palavras (Spintax anti-ban):</span>
              <code className="font-mono text-teal-700 bg-teal-50 px-1 rounded">{'{opção1|opção2|opção3}'}</code>
            </div>
            <p className="text-slate-500">
              O sistema sorteia aleatoriamente uma das palavras a cada disparo. Isso evita que o WhatsApp bloqueie o número da clínica por mensagens idênticas em massa.
            </p>
          </div>
        </div>

        {/* Lista de Cards Expansíveis (AC-230, AC-231, AC-232) */}
        <div data-testid="templates-accordion" className="mt-5 space-y-3">
          {cards.map((card) => {
            const isExpanded = expandedCard === card.key;
            const previewText = simulateTemplatePreview(card.value);
            const isSaving = savingCard === card.key;
            const isSaved = savedCard === card.key;

            return (
              <div
                key={card.key}
                data-testid={`template-card-${card.testId}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-teal-300 bg-white shadow-sm ring-1 ring-teal-200'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {/* Cabeçalho Clicável do Card (AC-230) */}
                <button
                  type="button"
                  data-testid={`card-header-${card.testId}`}
                  onClick={() => handleToggleCard(card.key)}
                  className="w-full p-4 flex items-center justify-between text-left gap-3 focus:outline-none min-h-[52px]"
                  aria-expanded={isExpanded}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {card.title}
                    </h4>
                    {!isExpanded && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 italic">
                        {previewText || card.value || 'Nenhum texto configurado'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSaved && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Salvo
                      </span>
                    )}
                    <span className="p-1 rounded-lg bg-slate-200/60 text-slate-600">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                </button>

                {/* Corpo do Card Expandido */}
                {isExpanded && (
                  <div
                    data-testid={`card-body-${card.testId}`}
                    className="px-4 pb-4 pt-1 space-y-3.5 border-t border-slate-100"
                  >
                    {/* Campo de Edição de Texto */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Texto da Mensagem:
                      </label>
                      <textarea
                        data-testid={`input-template-${card.testId}`}
                        value={card.value}
                        onChange={(e) => card.setValue(e.target.value)}
                        rows={3}
                        required
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
                        placeholder="Digite o modelo de mensagem..."
                      />
                    </div>

                    {/* Chips de Inserção Rápida (AC-228) */}
                    <div
                      data-testid={`chips-${card.testId}`}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <span className="text-[11px] text-slate-400 font-medium">Inserir:</span>
                      {card.chips.map((chip) => (
                        <button
                          key={chip.tag}
                          type="button"
                          data-testid={chip.testId}
                          onClick={() => handleInsertTag(card.setValue, chip.tag)}
                          className={`px-2 py-0.5 text-[11px] font-mono rounded-md transition-colors ${
                            chip.isSpintax
                              ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Prévia Contextual em Tempo Real dentro do Card (AC-231) */}
                    {previewText && (
                      <div
                        data-testid={card.testId === 'confirmation' ? 'template-preview-box' : `preview-box-${card.testId}`}
                        data-card-preview={card.testId}
                        className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-xs space-y-1"
                      >
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Prévia do WhatsApp ({card.previewLabel}):</span>
                        </div>
                        <p className="bg-white p-2.5 rounded-lg border border-emerald-100 text-slate-800 font-medium italic shadow-2xs">
                          "{previewText}"
                        </p>
                      </div>
                    )}

                    {/* Botão de Salvar Individual por Card (AC-232) */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-400">
                        {isSaved && (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Mensagem salva com sucesso!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          data-testid={`btn-save-card-${card.testId}`}
                          onClick={() => handleSaveSingleCard(card.key, card.field, card.value)}
                          disabled={isSaving}
                          className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl inline-flex items-center gap-1.5 shadow-xs min-h-[40px] transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSaving ? 'Salvando...' : 'Salvar Mensagem'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rodapé da Gaveta */}
        <div className="flex items-center justify-end gap-2 pt-5 mt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
