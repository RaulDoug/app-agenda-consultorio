# Plano de execução — autenticacao-login-frontend

> gerado por `onp-spec plano` em 2026-10-20 19:47 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano autenticacao-login-frontend --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 10 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/autenticacao-login-frontend`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-001 | Contratos compartilhados de autenticação e política de senhas | `claude-sonnet-5` | medium |
| T-002 | Migração Dexie v2 e Repositório Local de Sessão | `claude-sonnet-5` | medium |
| T-003 | Cliente HTTP ApiClient e Serviço de Autenticação | `claude-sonnet-5` | medium |
| T-004 | Migração do SyncManager e Módulo de WhatsApp para Bearer Token | `claude-sonnet-5` | medium |
| T-005 | Provedor de Estado AuthProvider e Hook useAuth | `claude-sonnet-5` | medium |
| T-006 | Hooks de Formulário useLoginForm e useChangePasswordForm | `claude-sonnet-5` | medium |
| T-007 | Componentes Visuais da Tela de Login, Troca de Senha e Splash | `claude-sonnet-5` | medium |
| T-008 | Integração no Shell da Aplicação e Card de Perfil em Ajustes | `claude-sonnet-5` | medium |
| T-009 | Automação E2E com Playwright e Validação de Regressão | `claude-sonnet-5` | medium |
| T-010 | Documentação Técnica da Funcionalidade e Atualização das Regras Globais | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/autenticacao-login-frontend` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify autenticacao-login-frontend` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/autenticacao-login-frontend   # ou: git checkout spec/autenticacao-login-frontend
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-001

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-001 — "Contratos compartilhados de autenticação e política de senhas"
  critérios/refs: AC-162 (Validação da política de senha e cancelamento com retorno seguro ao login)
  arquivos permitidos (e seus testes): shared/src/types/auth.ts, shared/src/domain/password-policy.ts, shared/src/index.ts, shared/src/__tests__/password-policy.spec.ts
  mensagem de commit: "T-001 autenticacao-login-frontend: Contratos compartilhados de autenticação e política de senhas"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-001 concluida` após o commit.

#### Prompt — T-002

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-002 — "Migração Dexie v2 e Repositório Local de Sessão"
  critérios/refs: AC-151 (Redirecionamento obrigatório para tela de login quando não há sessão ativa), AC-157 (Lembrar último e-mail autenticado com sucesso no formulário), AC-158 (Abertura direta instantânea (< 5ms) do app quando há sessão salva no Dexie mesmo offline), AC-165 (Confirmação de logout com alerta de mutações pendentes na outbox e limpeza local completa)
  arquivos permitidos (e seus testes): frontend/src/db/types.ts, frontend/src/db/local-db.ts, frontend/src/db/repositories/auth-session-local-repository.ts, frontend/src/db/repositories/__tests__/auth-session-local-repository.spec.ts
  mensagem de commit: "T-002 autenticacao-login-frontend: Migração Dexie v2 e Repositório Local de Sessão"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-002 concluida` após o commit.

#### Prompt — T-003

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-003 — "Cliente HTTP ApiClient e Serviço de Autenticação"
  critérios/refs: AC-152 (Submissão de credenciais com normalização de e-mail e autenticação com sucesso), AC-153 (Apresentação de erro amigável em caso de credenciais inválidas (HTTP 401)), AC-154 (Tratamento de bloqueio por força bruta (HTTP 429) com tempo de espera), AC-155 (Alerta amigável de conexão de rede no primeiro login com repetição), AC-160 (Revalidação em segundo plano via GET /api/auth/me com atualização de perfil ou logout gracioso), AC-163 (Requisições do SyncManager e WhatsApp utilizando Authorization Bearer sem x-tenant-id)
  arquivos permitidos (e seus testes): frontend/src/services/api-client.ts, frontend/src/services/auth-api.ts, frontend/src/services/__tests__/api-client.spec.ts, frontend/src/services/__tests__/auth-api.spec.ts
  mensagem de commit: "T-003 autenticacao-login-frontend: Cliente HTTP ApiClient e Serviço de Autenticação"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-003 concluida` após o commit.

#### Prompt — T-004

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-004 — "Migração do SyncManager e Módulo de WhatsApp para Bearer Token"
  critérios/refs: AC-163 (Requisições do SyncManager e WhatsApp utilizando Authorization Bearer sem x-tenant-id)
  arquivos permitidos (e seus testes): frontend/src/sync/sync-manager.ts, frontend/src/sync/__tests__/sync-manager.spec.ts
  mensagem de commit: "T-004 autenticacao-login-frontend: Migração do SyncManager e Módulo de WhatsApp para Bearer Token"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-004 concluida` após o commit.

#### Prompt — T-005

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-005 — "Provedor de Estado AuthProvider e Hook useAuth"
  critérios/refs: AC-151 (Redirecionamento obrigatório para tela de login quando não há sessão ativa), AC-158 (Abertura direta instantânea (< 5ms) do app quando há sessão salva no Dexie mesmo offline), AC-160 (Revalidação em segundo plano via GET /api/auth/me com atualização de perfil ou logout gracioso), AC-161 (Bloqueio e redirecionamento para tela de Troca Obrigatória de Senha quando must_change_password é verdadeiro), AC-165 (Confirmação de logout com alerta de mutações pendentes na outbox e limpeza local completa)
  arquivos permitidos (e seus testes): frontend/src/features/auth/hooks/AuthContext.tsx, frontend/src/features/auth/hooks/useAuth.ts, frontend/src/features/auth/hooks/__tests__/auth-context.spec.tsx
  mensagem de commit: "T-005 autenticacao-login-frontend: Provedor de Estado AuthProvider e Hook useAuth"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-005 concluida` após o commit.

#### Prompt — T-006

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-006 — "Hooks de Formulário useLoginForm e useChangePasswordForm"
  critérios/refs: AC-152 (Submissão de credenciais com normalização de e-mail e autenticação com sucesso), AC-153 (Apresentação de erro amigável em caso de credenciais inválidas (HTTP 401)), AC-154 (Tratamento de bloqueio por força bruta (HTTP 429) com tempo de espera), AC-155 (Alerta amigável de conexão de rede no primeiro login com repetição), AC-156 (Alternância de visibilidade da senha (mostrar/ocultar senha)), AC-157 (Lembrar último e-mail autenticado com sucesso no formulário), AC-162 (Validação da política de senha e cancelamento com retorno seguro ao login)
  arquivos permitidos (e seus testes): frontend/src/features/auth/hooks/useLoginForm.ts, frontend/src/features/auth/hooks/useChangePasswordForm.ts, frontend/src/features/auth/hooks/__tests__/use-login-form.spec.ts
  mensagem de commit: "T-006 autenticacao-login-frontend: Hooks de Formulário useLoginForm e useChangePasswordForm"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-006 concluida` após o commit.

#### Prompt — T-007

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-007 — "Componentes Visuais da Tela de Login, Troca de Senha e Splash"
  critérios/refs: AC-151 (Redirecionamento obrigatório para tela de login quando não há sessão ativa), AC-152 (Submissão de credenciais com normalização de e-mail e autenticação com sucesso), AC-153 (Apresentação de erro amigável em caso de credenciais inválidas (HTTP 401)), AC-154 (Tratamento de bloqueio por força bruta (HTTP 429) com tempo de espera), AC-155 (Alerta amigável de conexão de rede no primeiro login com repetição), AC-156 (Alternância de visibilidade da senha (mostrar/ocultar senha)), AC-157 (Lembrar último e-mail autenticado com sucesso no formulário), AC-159 (Splash minimalista com branding durante a checagem inicial da sessão), AC-161 (Bloqueio e redirecionamento para tela de Troca Obrigatória de Senha quando must_change_password é verdadeiro), AC-162 (Validação da política de senha e cancelamento com retorno seguro ao login), AC-165 (Confirmação de logout com alerta de mutações pendentes na outbox e limpeza local completa)
  arquivos permitidos (e seus testes): frontend/src/features/auth/components/LoginScreen.tsx, frontend/src/features/auth/components/ChangePasswordScreen.tsx, frontend/src/features/auth/components/SessionSplash.tsx, frontend/src/features/auth/components/AuthGate.tsx, frontend/src/features/auth/components/LogoutConfirmDrawer.tsx, frontend/src/features/auth/__tests__/auth-components.spec.tsx
  mensagem de commit: "T-007 autenticacao-login-frontend: Componentes Visuais da Tela de Login, Troca de Senha e Splash"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-007 concluida` após o commit.

#### Prompt — T-008

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-008 — "Integração no Shell da Aplicação e Card de Perfil em Ajustes"
  critérios/refs: AC-151 (Redirecionamento obrigatório para tela de login quando não há sessão ativa), AC-164 (Card de Perfil do Consultório na aba Ajustes com exibição de dados e botão de logout), AC-165 (Confirmação de logout com alerta de mutações pendentes na outbox e limpeza local completa)
  arquivos permitidos (e seus testes): frontend/src/features/settings/components/ClinicProfileCard.tsx, frontend/src/features/settings/components/SettingsView.tsx, frontend/src/App.tsx, frontend/src/main.tsx, frontend/src/__tests__/app-auth-integration.spec.tsx
  mensagem de commit: "T-008 autenticacao-login-frontend: Integração no Shell da Aplicação e Card de Perfil em Ajustes"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-008 concluida` após o commit.

#### Prompt — T-009

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-009 — "Automação E2E com Playwright e Validação de Regressão"
  critérios/refs: AC-151 (Redirecionamento obrigatório para tela de login quando não há sessão ativa), AC-152 (Submissão de credenciais com normalização de e-mail e autenticação com sucesso), AC-158 (Abertura direta instantânea (< 5ms) do app quando há sessão salva no Dexie mesmo offline)
  arquivos permitidos (e seus testes): frontend/e2e/cliniassist-mobile.spec.ts, frontend/e2e/auth-flow.spec.ts
  mensagem de commit: "T-009 autenticacao-login-frontend: Automação E2E com Playwright e Validação de Regressão"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-009 concluida` após o commit.

#### Prompt — T-010

```
Você executa UMA tarefa da feature "autenticacao-login-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-login-frontend/spec.md, .spec/features/autenticacao-login-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-010 — "Documentação Técnica da Funcionalidade e Atualização das Regras Globais"
  critérios/refs: AC-151 (Redirecionamento obrigatório para tela de login quando não há sessão ativa), AC-152 (Submissão de credenciais com normalização de e-mail e autenticação com sucesso), AC-153 (Apresentação de erro amigável em caso de credenciais inválidas (HTTP 401)), AC-154 (Tratamento de bloqueio por força bruta (HTTP 429) com tempo de espera), AC-155 (Alerta amigável de conexão de rede no primeiro login com repetição), AC-156 (Alternância de visibilidade da senha (mostrar/ocultar senha)), AC-157 (Lembrar último e-mail autenticado com sucesso no formulário), AC-158 (Abertura direta instantânea (< 5ms) do app quando há sessão salva no Dexie mesmo offline), AC-159 (Splash minimalista com branding durante a checagem inicial da sessão), AC-160 (Revalidação em segundo plano via GET /api/auth/me com atualização de perfil ou logout gracioso), AC-161 (Bloqueio e redirecionamento para tela de Troca Obrigatória de Senha quando must_change_password é verdadeiro), AC-162 (Validação da política de senha e cancelamento com retorno seguro ao login), AC-163 (Requisições do SyncManager e WhatsApp utilizando Authorization Bearer sem x-tenant-id), AC-164 (Card de Perfil do Consultório na aba Ajustes com exibição de dados e botão de logout), AC-165 (Confirmação de logout com alerta de mutações pendentes na outbox e limpeza local completa)
  arquivos permitidos (e seus testes): docs/frontend/funcionalidades/autenticacao_login.md, docs/frontend/funcionalidades/regras_globais.md
  mensagem de commit: "T-010 autenticacao-login-frontend: Documentação Técnica da Funcionalidade e Atualização das Regras Globais"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-login-frontend T-010 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify autenticacao-login-frontend
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-autenticacao-login-frontend-mvh3hzvz --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-autenticacao-login-frontend-mvh3hzvz --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo autenticacao-login-frontend --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo autenticacao-login-frontend --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

