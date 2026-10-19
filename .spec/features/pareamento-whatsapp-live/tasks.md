# Tarefas: Pareamento WhatsApp em Tempo Real e Correção de Inicialização

> feature: pareamento-whatsapp-live

## T-059 — Ajuste de Inicialização do Backend com TypeScript Watch [concluida]
- Refs: US-048, AC-079
- Arquivos: backend/package.json
- Notas: Configurar script dev do backend com tsx watch --env-file=.env src/app.ts garantindo subida sem erro de resolução.

## T-060 — Ciclo de Vida da Sessão e Auto-Criação de Instância na Evolution API [concluida]
- Refs: US-049, AC-080, AC-081
- Arquivos: backend/src/whatsapp/evolution-client.ts, backend/src/routes/whatsapp.ts
- Notas: Suporte a createInstance, logoutInstance, sincronização bidirecional do status na rota GET /session e endpoint POST /disconnect.

## T-061 — Conexão do Frontend com QR Code Real e Polling Reativo nos Ajustes [concluida]
- Refs: US-050, AC-082
- Arquivos: frontend/src/features/settings/components/SettingsView.tsx, frontend/src/App.tsx
- Notas: Repassar QR Code em base64 e número conectado, polling inteligente a cada 3s na aba Ajustes quando desconectado e atualização imediata para conectado após leitura.

## T-062 — Suíte de Testes com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-048, US-049, US-050, AC-079, AC-080, AC-081, AC-082
- Arquivos: backend/src/whatsapp/__tests__/whatsapp-live-pairing.spec.ts, frontend/src/features/settings/__tests__/whatsapp-live-pairing-ui.spec.tsx
- Notas: Testes unitários e de integração com tags @spec:AC-079, @spec:AC-080, @spec:AC-081, @spec:AC-082 validando 100% dos critérios.
