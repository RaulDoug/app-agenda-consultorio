# Tarefas: Réplica Automática de Confirmação e Remarcação no WhatsApp

> feature: replica-confirmacao-whatsapp

## T-067 — Backend: Mapeamento e Disparo de Mensagens de Réplica no Webhook [concluida]
- Refs: US-052, AC-086, AC-087, AC-088
- Arquivos: backend/src/routes/webhooks.ts
- Notas: Integrar chamada ao evolutionClient.sendTextMessage após atualização de status no webhook com try/catch isolado para resiliência.

## T-068 — Backend: Templates de Mensagens Humanizadas com Variação [concluida]
- Refs: US-052, AC-086, AC-087
- Arquivos: backend/src/whatsapp/reply-templates.ts
- Notas: Criar gerador de mensagens de retorno humanizadas com nome do paciente, horário e variação dinâmica (Spintax).

## T-069 — Testes Automatizados com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-052, AC-086, AC-087, AC-088
- Arquivos: backend/src/whatsapp/__tests__/whatsapp-auto-reply.spec.ts
- Notas: Suíte de testes validando os critérios @spec:AC-086, @spec:AC-087 e @spec:AC-088 com MockEvolutionClient e banco em memória.
