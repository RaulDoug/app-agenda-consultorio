# Tasks: Whatsapp bullmq

> feature: whatsapp-bullmq

## T-013 — Parser Semântico de Respostas e Gerador Spintax Anti-Ban [concluida]
- Refs: US-011, US-012, AC-019, AC-020, AC-021
- Arquivos: backend/src/whatsapp/parser.ts, backend/src/whatsapp/spintax.ts
- Notas: Classificação determinística de respostas de pacientes (confirmação, reagendamento, texto livre) e geração estocástica Spintax de mensagens.

## T-014 — Cliente Evolution API e Mock para Testes Determinísticos [concluida]
- Refs: US-013, US-014, AC-023
- Arquivos: backend/src/whatsapp/evolution-client.ts, backend/src/whatsapp/__tests__/mock-evolution.ts
- Notas: Wrapper HTTP para disparos na Evolution API com tratamento de erros transitórios (502/503) e mock in-memory para testes sem internet.

## T-015 — Fila BullMQ com Jitter Humanizado e Pausa Automática [concluida]
- Refs: US-013, AC-022, AC-023, AC-026
- Arquivos: backend/src/whatsapp/queue.ts, backend/src/whatsapp/scheduler.ts
- Notas: Configuração de filas BullMQ, enfileiramento com delays incrementais de 20s a 50s e mecanismo de pausa imediata ao perder conexão.

## T-016 — Rota de Webhook da Evolution API e Atualização de Status da Agenda [concluida]
- Refs: US-011, US-014, AC-024, AC-025, AC-026
- Arquivos: backend/src/routes/webhooks.ts, backend/src/app.ts
- Notas: Endpoint POST /api/webhooks/whatsapp com verificação de instância, atualização de agendamento por telefone, tratamento de número desconhecido e evento de desconexão.

## T-017 — Suíte de Testes Automatizados TDD Integrada [concluida]
- Refs: US-011, US-012, US-013, US-014, AC-019, AC-020, AC-021, AC-022, AC-023, AC-024, AC-025, AC-026
- Arquivos: backend/src/whatsapp/__tests__/whatsapp.spec.ts
- Notas: Testes de ponta a ponta com ioredis-mock e pg-mem cobrindo todos os critérios AC-019 a AC-026.
