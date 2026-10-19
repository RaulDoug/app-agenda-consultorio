# Tarefas: Correção do QR Code e Resiliência na Evolution API

> feature: correcao-qrcode-evolution

## T-063 — Backend: Tratamento Resiliente de QR Code sem Base64 Corrompido [concluida]
- Refs: US-051, AC-083
- Arquivos: backend/src/routes/whatsapp.ts
- Notas: Remover a string base64 corrompida de fallback. Quando a Evolution API retornar count 0 ou sem base64, responder HTTP 200 com qrcode: null de forma limpa.

## T-064 — Frontend: Placeholder com Spinner e Fallback Visual onError [concluida]
- Refs: US-051, AC-084
- Arquivos: frontend/src/features/analytics/components/WhatsAppPairingView.tsx
- Notas: Exibir card amigável com spinner animado quando qrcodeBase64 for nulo e interceptar onError na tag img para nunca exibir ícone quebrado no navegador.

## T-065 — Infraestrutura: Limpeza de Instâncias Órfãs na Evolution API [concluida]
- Refs: US-051, AC-085
- Arquivos: backend/src/whatsapp/evolution-client.ts
- Notas: Deletar as instâncias órfãs (test_instance, instancia_sorriso, instancia_inativa) mantendo apenas cliniassist_default livre de concorrência.

## T-066 — Testes Automatizados com Prova Mecânica e Auditoria CI [concluida]
- Refs: US-051, AC-083, AC-084, AC-085
- Arquivos: backend/src/whatsapp/__tests__/whatsapp-qrcode-resilience.spec.ts, frontend/src/features/settings/__tests__/whatsapp-qrcode-resilience-ui.spec.tsx
- Notas: Testes unitários/integração anotados com @spec:AC-083, @spec:AC-084 e @spec:AC-085 garantindo conformidade mecânica do onp-spec audit.
