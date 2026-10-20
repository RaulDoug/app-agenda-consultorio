# Plano de execução — autenticacao-usuarios

> gerado por `onp-spec plano` em 2026-10-20 13:24 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano autenticacao-usuarios --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 10 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/autenticacao-usuarios`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-106 | DDL, Schema e Migrations: colunas must_change_password, token_version e password_changed_at | `claude-sonnet-5` | medium |
| T-107 | Instalação de bcrypt e PasswordService com hash, compare, política e gerador seguro | `claude-sonnet-5` | medium |
| T-108 | TenantRepository com consultas estritas multi-tenant de autenticação e sessão | `claude-sonnet-5` | medium |
| T-109 | AuthService: regras de negócio de login, changePassword e getProfile | `claude-sonnet-5` | medium |
| T-110 | UserAdminService e Scripts CLI de Criação e Reset de Senha | `claude-sonnet-5` | medium |
| T-111 | Middleware de Autenticação Endurecido (remoção de x-tenant-id, validação de token_version e 403) | `claude-sonnet-5` | medium |
| T-112 | Rate Limiter de Login em Memória | `claude-sonnet-5` | medium |
| T-113 | AuthController, Rotas de Autenticação e Proteção da Rota de Analytics | `claude-sonnet-5` | medium |
| T-114 | Migração dos Testes Existentes do Backend para Bearer Token | `claude-sonnet-5` | medium |
| T-115 | Documentação de Funcionalidade e Atualização de Regras Globais | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/autenticacao-usuarios` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify autenticacao-usuarios` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/autenticacao-usuarios   # ou: git checkout spec/autenticacao-usuarios
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-106

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-106 — "DDL, Schema e Migrations: colunas must_change_password, token_version e password_changed_at"
  critérios/refs: AC-118 (Provisionamento de tenant com hash bcrypt e ausência de rotas públicas de registro), AC-120 (Alteração de senha com política segura e invalidação de tokens anteriores), AC-122 (Reset de senha com credencial temporária e exigência de troca obrigatória)
  arquivos permitidos (e seus testes): backend/src/db/schema.sql, backend/src/db/migrations/001_tenant_auth_columns.sql, backend/scripts/db-migrate.ts
  mensagem de commit: "T-106 autenticacao-usuarios: DDL, Schema e Migrations: colunas must_change_password, token_version e password_changed_at"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-106 concluida` após o commit.

#### Prompt — T-107

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-107 — "Instalação de bcrypt e PasswordService com hash, compare, política e gerador seguro"
  critérios/refs: AC-118 (Provisionamento de tenant com hash bcrypt e ausência de rotas públicas de registro), AC-120 (Alteração de senha com política segura e invalidação de tokens anteriores), AC-121 (Rejeição de troca com senha atual incorreta ou descumprimento da política), AC-122 (Reset de senha com credencial temporária e exigência de troca obrigatória)
  arquivos permitidos (e seus testes): backend/package.json, backend/src/services/password-service.ts, backend/src/services/__tests__/password-service.spec.ts
  mensagem de commit: "T-107 autenticacao-usuarios: Instalação de bcrypt e PasswordService com hash, compare, política e gerador seguro"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-107 concluida` após o commit.

#### Prompt — T-108

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-108 — "TenantRepository com consultas estritas multi-tenant de autenticação e sessão"
  critérios/refs: AC-118 (Provisionamento de tenant com hash bcrypt e ausência de rotas públicas de registro), AC-119 (Rejeição de e-mails duplicados e validação cadastral na criação), AC-120 (Alteração de senha com política segura e invalidação de tokens anteriores), AC-122 (Reset de senha com credencial temporária e exigência de troca obrigatória), AC-123 (Autenticação bem-sucedida gerando JWT com token_version e status cadastral), AC-127 (Proteção obrigatória com authMiddleware em rotas de analytics e validação de token_version)
  arquivos permitidos (e seus testes): backend/src/repositories/tenant-repository.ts, backend/src/repositories/__tests__/tenant-repository.spec.ts
  mensagem de commit: "T-108 autenticacao-usuarios: TenantRepository com consultas estritas multi-tenant de autenticação e sessão"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-108 concluida` após o commit.

#### Prompt — T-109

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-109 — "AuthService: regras de negócio de login, changePassword e getProfile"
  critérios/refs: AC-120 (Alteração de senha com política segura e invalidação de tokens anteriores), AC-121 (Rejeição de troca com senha atual incorreta ou descumprimento da política), AC-123 (Autenticação bem-sucedida gerando JWT com token_version e status cadastral), AC-124 (Rejeição genérica de credenciais inválidas e rate limiting contra força bruta)
  arquivos permitidos (e seus testes): backend/src/services/auth-service.ts, backend/src/services/__tests__/auth-service.spec.ts
  mensagem de commit: "T-109 autenticacao-usuarios: AuthService: regras de negócio de login, changePassword e getProfile"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-109 concluida` após o commit.

#### Prompt — T-110

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-110 — "UserAdminService e Scripts CLI de Criação e Reset de Senha"
  critérios/refs: AC-118 (Provisionamento de tenant com hash bcrypt e ausência de rotas públicas de registro), AC-119 (Rejeição de e-mails duplicados e validação cadastral na criação), AC-122 (Reset de senha com credencial temporária e exigência de troca obrigatória)
  arquivos permitidos (e seus testes): backend/src/services/user-admin-service.ts, backend/scripts/user-create.ts, backend/scripts/user-reset-password.ts, backend/src/services/__tests__/user-admin-service.spec.ts
  mensagem de commit: "T-110 autenticacao-usuarios: UserAdminService e Scripts CLI de Criação e Reset de Senha"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-110 concluida` após o commit.

#### Prompt — T-111

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-111 — "Middleware de Autenticação Endurecido (remoção de x-tenant-id, validação de token_version e 403)"
  critérios/refs: AC-125 (Bloqueio estrito com HTTP 403 em rotas de negócio sob flag must_change_password), AC-126 (Rejeição de requisições autenticadas apenas com o header x-tenant-id), AC-127 (Proteção obrigatória com authMiddleware em rotas de analytics e validação de token_version)
  arquivos permitidos (e seus testes): backend/src/middlewares/auth.ts, backend/src/middlewares/__tests__/auth.spec.ts
  mensagem de commit: "T-111 autenticacao-usuarios: Middleware de Autenticação Endurecido (remoção de x-tenant-id, validação de token_version e 403)"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-111 concluida` após o commit.

#### Prompt — T-112

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-112 — "Rate Limiter de Login em Memória"
  critérios/refs: AC-124 (Rejeição genérica de credenciais inválidas e rate limiting contra força bruta)
  arquivos permitidos (e seus testes): backend/src/middlewares/login-rate-limiter.ts, backend/src/middlewares/__tests__/login-rate-limiter.spec.ts
  mensagem de commit: "T-112 autenticacao-usuarios: Rate Limiter de Login em Memória"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-112 concluida` após o commit.

#### Prompt — T-113

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-113 — "AuthController, Rotas de Autenticação e Proteção da Rota de Analytics"
  critérios/refs: AC-118 (Provisionamento de tenant com hash bcrypt e ausência de rotas públicas de registro), AC-120 (Alteração de senha com política segura e invalidação de tokens anteriores), AC-121 (Rejeição de troca com senha atual incorreta ou descumprimento da política), AC-123 (Autenticação bem-sucedida gerando JWT com token_version e status cadastral), AC-124 (Rejeição genérica de credenciais inválidas e rate limiting contra força bruta), AC-125 (Bloqueio estrito com HTTP 403 em rotas de negócio sob flag must_change_password), AC-126 (Rejeição de requisições autenticadas apenas com o header x-tenant-id), AC-127 (Proteção obrigatória com authMiddleware em rotas de analytics e validação de token_version)
  arquivos permitidos (e seus testes): backend/src/controllers/auth-controller.ts, backend/src/routes/auth.ts, backend/src/routes/analytics.ts, backend/src/routes/financial.ts, backend/src/app.ts, backend/src/routes/__tests__/auth.routes.spec.ts
  mensagem de commit: "T-113 autenticacao-usuarios: AuthController, Rotas de Autenticação e Proteção da Rota de Analytics"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-113 concluida` após o commit.

#### Prompt — T-114

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-114 — "Migração dos Testes Existentes do Backend para Bearer Token"
  critérios/refs: AC-126 (Rejeição de requisições autenticadas apenas com o header x-tenant-id), AC-127 (Proteção obrigatória com authMiddleware em rotas de analytics e validação de token_version)
  arquivos permitidos (e seus testes): backend/src/routes/__tests__/api.spec.ts, backend/src/api-complementar/__tests__/api-complementar.spec.ts, backend/src/analytics/__tests__/analytics.spec.ts, backend/src/financial/__tests__/financial.spec.ts, backend/src/whatsapp/__tests__/whatsapp-live-pairing.spec.ts, backend/src/whatsapp/__tests__/whatsapp-qrcode-resilience.spec.ts
  mensagem de commit: "T-114 autenticacao-usuarios: Migração dos Testes Existentes do Backend para Bearer Token"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-114 concluida` após o commit.

#### Prompt — T-115

```
Você executa UMA tarefa da feature "autenticacao-usuarios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/autenticacao-usuarios/spec.md, .spec/features/autenticacao-usuarios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-115 — "Documentação de Funcionalidade e Atualização de Regras Globais"
  critérios/refs: AC-118 (Provisionamento de tenant com hash bcrypt e ausência de rotas públicas de registro), AC-120 (Alteração de senha com política segura e invalidação de tokens anteriores), AC-122 (Reset de senha com credencial temporária e exigência de troca obrigatória), AC-123 (Autenticação bem-sucedida gerando JWT com token_version e status cadastral), AC-125 (Bloqueio estrito com HTTP 403 em rotas de negócio sob flag must_change_password), AC-126 (Rejeição de requisições autenticadas apenas com o header x-tenant-id), AC-127 (Proteção obrigatória com authMiddleware em rotas de analytics e validação de token_version)
  arquivos permitidos (e seus testes): docs/backend/funcionalidades/autenticacao_usuarios.md, docs/backend/funcionalidades/regras_globais.md
  mensagem de commit: "T-115 autenticacao-usuarios: Documentação de Funcionalidade e Atualização de Regras Globais"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa autenticacao-usuarios T-115 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify autenticacao-usuarios
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-autenticacao-usuarios-mvgpsz84 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-autenticacao-usuarios-mvgpsz84 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo autenticacao-usuarios --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo autenticacao-usuarios --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

