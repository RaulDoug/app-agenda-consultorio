# Tasks: Autenticacao login frontend

> feature: autenticacao-login-frontend

## T-001 — Contratos compartilhados de autenticação e política de senhas [concluida]
- Refs: US-092, US-093, AC-162
- Arquivos: shared/src/types/auth.ts, shared/src/domain/password-policy.ts, shared/src/index.ts, shared/src/__tests__/password-policy.spec.ts
- Notas: Tipos para LoginRequest, LoginResponse, ChangePasswordRequest, AuthTenantProfile e validação pura de política de senhas (8+ chars, letra, número, diferente da atual).

## T-002 — Migração Dexie v2 e Repositório Local de Sessão [concluida]
- Refs: US-092, US-093, US-094, AC-151, AC-157, AC-158, AC-165
- Arquivos: frontend/src/db/types.ts, frontend/src/db/local-db.ts, frontend/src/db/repositories/auth-session-local-repository.ts, frontend/src/db/repositories/__tests__/auth-session-local-repository.spec.ts
- Notas: Criação da tabela auth_session, métodos getSession, saveSession, clearSession, getSavedEmail, setSavedEmail e countPendingMutations fora da outbox.

## T-003 — Cliente HTTP ApiClient e Serviço de Autenticação [concluida]
- Refs: US-092, US-093, US-094, AC-152, AC-153, AC-154, AC-155, AC-160, AC-163
- Arquivos: frontend/src/services/api-client.ts, frontend/src/services/auth-api.ts, frontend/src/services/__tests__/api-client.spec.ts, frontend/src/services/__tests__/auth-api.spec.ts
- Notas: Injeção de Bearer token, captura de 401 e 403 (PASSWORD_CHANGE_REQUIRED), chamadas login, changePassword e me com normalização de erros e detecção de conectividade.

## T-004 — Migração do SyncManager e Módulo de WhatsApp para Bearer Token [concluida]
- Refs: US-094, AC-163
- Arquivos: frontend/src/sync/sync-manager.ts, frontend/src/sync/__tests__/sync-manager.spec.ts
- Notas: Substituição do header x-tenant-id por Authorization Bearer, integração com ApiClient e tratamento resiliente de 401 sem descartar itens pendentes da outbox.

## T-005 — Provedor de Estado AuthProvider e Hook useAuth [concluida]
- Refs: US-092, US-093, US-094, AC-151, AC-158, AC-160, AC-161, AC-165
- Arquivos: frontend/src/features/auth/hooks/AuthContext.tsx, frontend/src/features/auth/hooks/useAuth.ts, frontend/src/features/auth/hooks/__tests__/auth-context.spec.tsx
- Notas: Gerenciamento dos estados de sessão (loading, unauthenticated, must_change_password, authenticated), revalidação /me em background e controle de logout com limpeza total.

## T-006 — Hooks de Formulário useLoginForm e useChangePasswordForm [concluida]
- Refs: US-092, US-093, AC-152, AC-153, AC-154, AC-155, AC-156, AC-157, AC-162
- Arquivos: frontend/src/features/auth/hooks/useLoginForm.ts, frontend/src/features/auth/hooks/useChangePasswordForm.ts, frontend/src/features/auth/hooks/__tests__/use-login-form.spec.ts
- Notas: Validação local, e-mail memorizado, anti-duplo clique, toggle de visibilidade de senha e feedback claro de mensagens de erro da API.

## T-007 — Componentes Visuais da Tela de Login, Troca de Senha e Splash [concluida]
- Refs: US-092, US-093, US-094, AC-151, AC-152, AC-153, AC-154, AC-155, AC-156, AC-157, AC-159, AC-161, AC-162, AC-165
- Arquivos: frontend/src/features/auth/components/LoginScreen.tsx, frontend/src/features/auth/components/ChangePasswordScreen.tsx, frontend/src/features/auth/components/SessionSplash.tsx, frontend/src/features/auth/components/AuthGate.tsx, frontend/src/features/auth/components/LogoutConfirmDrawer.tsx, frontend/src/features/auth/__tests__/auth-components.spec.tsx
- Notas: Interfaces mobile-first One-Thumb, feedback de carregamento, alternância de senha, botão voltar no must_change_password e gaveta de confirmação com contagem de pendências.

## T-008 — Integração no Shell da Aplicação e Card de Perfil em Ajustes [concluida]
- Refs: US-092, US-094, AC-151, AC-164, AC-165
- Arquivos: frontend/src/features/settings/components/ClinicProfileCard.tsx, frontend/src/features/settings/components/SettingsView.tsx, frontend/src/App.tsx, frontend/src/main.tsx, frontend/src/__tests__/app-auth-integration.spec.tsx
- Notas: Envelopamento com AuthProvider/AuthGate em main.tsx, propagação do token no App.tsx e inclusão do ClinicProfileCard com botão 'Sair da Conta' no topo de Ajustes.

## T-009 — Automação E2E com Playwright e Validação de Regressão [concluida]
- Refs: US-092, US-093, AC-151, AC-152, AC-158
- Arquivos: frontend/e2e/cliniassist-mobile.spec.ts, frontend/e2e/auth-flow.spec.ts
- Notas: Adaptação dos fluxos E2E existentes para autenticação automática e teste de jornada de login inválido, login válido e persistência offline.

## T-010 — Documentação Técnica da Funcionalidade e Atualização das Regras Globais [concluida]
- Refs: US-092, US-093, US-094, AC-151, AC-152, AC-153, AC-154, AC-155, AC-156, AC-157, AC-158, AC-159, AC-160, AC-161, AC-162, AC-163, AC-164, AC-165
- Arquivos: docs/frontend/funcionalidades/autenticacao_login.md, docs/frontend/funcionalidades/regras_globais.md
- Notas: Registro completo de arquitetura, fluxos, componentes, hooks, repositório e inserção da Seção 7 (Autenticação e Sessão) nas regras globais.
