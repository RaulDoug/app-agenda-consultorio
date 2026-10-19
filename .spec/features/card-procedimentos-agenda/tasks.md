# Tarefas: Visualização Compacta de Procedimentos no Card da Agenda

> feature: card-procedimentos-agenda

## T-079 — Frontend: Layout Empilhado e Truncamento a 2 Itens em AppointmentCard [concluida]
- Refs: US-058, AC-096
- Arquivos: frontend/src/features/agenda/components/AppointmentCard.tsx
- Notas: Reorganizar procedimentos verticalmente (um abaixo do outro), limitar a 2 itens e exibir indicador `... (+X mais)` se houver excedente.

## T-080 — Frontend: Garantia de Listagem Completa na Gaveta de Detalhes [concluida]
- Refs: US-058, AC-097
- Arquivos: frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx
- Notas: Assegurar que a gaveta de detalhes continue renderizando todos os procedimentos sem truncamento.

## T-081 — Testes Automatizados com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-058, AC-096, AC-097
- Arquivos: frontend/src/features/agenda/__tests__/card-procedures-layout.spec.tsx
- Notas: Testes com @spec: cobrindo card fechado com 3+ itens, truncamento a 2 com reticências, e abertura na gaveta com exibição completa.
