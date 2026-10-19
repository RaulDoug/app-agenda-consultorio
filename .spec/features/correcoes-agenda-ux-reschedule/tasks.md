# Tarefas: Controle de Encaixe, UX de Modais e Resiliência na Remarcação

> feature: correcoes-agenda-ux-reschedule

## T-075 — Frontend: Checkbox Explícito de Encaixe e Prevenção de Conflito em QuickAppointmentDrawer [concluida]
- Refs: US-055, AC-093
- Arquivos: frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx
- Notas: Inserir checkbox de autorização de encaixe em caso de sobreposição ou fora de expediente, impedindo salvar se desmarcado.

## T-076 — Frontend: Bloqueio de Scroll de Fundo e Backdrop Click nos Modais e Gavetas [concluida]
- Refs: US-056, AC-094
- Arquivos: frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx, frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx, frontend/src/features/agenda/components/RescheduleModal.tsx
- Notas: Bloquear scroll do body com overflow hidden enquanto aberto e fechar ao clicar no backdrop externo.

## T-077 — Frontend: Resiliência de Ciclo de Vida e Sincronização de Data em RescheduleModal [concluida]
- Refs: US-057, AC-095
- Arquivos: frontend/src/features/agenda/components/RescheduleModal.tsx
- Notas: Reset de isSubmitting no useEffect, bloco finally garantido no handleConfirm e inicialização da data do agendamento.

## T-078 — Testes Automatizados com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-055, US-056, US-057, AC-093, AC-094, AC-095
- Arquivos: frontend/src/features/agenda/__tests__/agenda-ux-reschedule.spec.tsx
- Notas: Suíte de testes completa cobrindo os 3 novos critérios de aceite com anotação @spec: e prova mecânica.
