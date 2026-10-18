# Plano de execução — api-complementar

> gerado por `onp-spec plano` em 2026-10-18 14:37 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano api-complementar --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 7 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/api-complementar`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-026 | Migração dos Algoritmos de Domínio Puro para `@cliniassist/shared` | `claude-sonnet-5` | medium |
| T-027 | Módulo de Autenticação e Emissão de Token JWT Multi-Tenant | `claude-sonnet-5` | medium |
| T-028 | Sincronização Delta (Pull Sync) do Servidor para o Dispositivo | `claude-sonnet-5` | medium |
| T-029 | Gerenciamento de Sessão e Status do WhatsApp com QR Code | `claude-sonnet-5` | medium |
| T-030 | Gestão de Expediente e Bloqueios de Agenda | `claude-sonnet-5` | medium |
| T-031 | Listagem e Filtro de Transações Financeiras para o Extrato | `claude-sonnet-5` | medium |
| T-032 | Suíte Integrada de Testes Automatizados TDD da API Complementar | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/api-complementar` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify api-complementar` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/api-complementar   # ou: git checkout spec/api-complementar
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-026

```
Você executa UMA tarefa da feature "api-complementar" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/api-complementar/spec.md, .spec/features/api-complementar/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-026 — "Migração dos Algoritmos de Domínio Puro para `@cliniassist/shared`"
  critérios/refs: AC-048 (Disponibilização e validação das regras de negócio em `@cliniassist/shared`)
  arquivos permitidos (e seus testes): shared/src/domain/business-hours.ts, shared/src/domain/smart-return.ts, shared/src/financial/calculator.ts, shared/src/financial/installments.ts, shared/src/index.ts
  mensagem de commit: "T-026 api-complementar: Migração dos Algoritmos de Domínio Puro para `@cliniassist/shared`"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa api-complementar T-026 concluida` após o commit.

#### Prompt — T-027

```
Você executa UMA tarefa da feature "api-complementar" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/api-complementar/spec.md, .spec/features/api-complementar/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-027 — "Módulo de Autenticação e Emissão de Token JWT Multi-Tenant"
  critérios/refs: AC-041 (Login com sucesso gerando token JWT e dados do tenant), AC-042 (Rejeição de login com credenciais incorretas ou tenant inativo)
  arquivos permitidos (e seus testes): backend/src/routes/auth.ts, backend/src/services/auth-service.ts, backend/src/app.ts
  mensagem de commit: "T-027 api-complementar: Módulo de Autenticação e Emissão de Token JWT Multi-Tenant"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa api-complementar T-027 concluida` após o commit.

#### Prompt — T-028

```
Você executa UMA tarefa da feature "api-complementar" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/api-complementar/spec.md, .spec/features/api-complementar/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-028 — "Sincronização Delta (Pull Sync) do Servidor para o Dispositivo"
  critérios/refs: AC-043 (Retorno delta incremental de mutações do servidor)
  arquivos permitidos (e seus testes): backend/src/routes/sync.ts, backend/src/repositories/sync-repository.ts
  mensagem de commit: "T-028 api-complementar: Sincronização Delta (Pull Sync) do Servidor para o Dispositivo"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa api-complementar T-028 concluida` após o commit.

#### Prompt — T-029

```
Você executa UMA tarefa da feature "api-complementar" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/api-complementar/spec.md, .spec/features/api-complementar/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-029 — "Gerenciamento de Sessão e Status do WhatsApp com QR Code"
  critérios/refs: AC-044 (Consulta de status da sessão WhatsApp e obtenção de QR Code)
  arquivos permitidos (e seus testes): backend/src/routes/whatsapp.ts, backend/src/whatsapp/session.ts, backend/src/app.ts
  mensagem de commit: "T-029 api-complementar: Gerenciamento de Sessão e Status do WhatsApp com QR Code"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa api-complementar T-029 concluida` após o commit.

#### Prompt — T-030

```
Você executa UMA tarefa da feature "api-complementar" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/api-complementar/spec.md, .spec/features/api-complementar/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-030 — "Gestão de Expediente e Bloqueios de Agenda"
  critérios/refs: AC-045 (Consulta e atualização do expediente semanal de trabalho), AC-046 (Cadastro, listagem e remoção de bloqueios de agenda)
  arquivos permitidos (e seus testes): backend/src/routes/business-hours.ts, backend/src/routes/schedule-blocks.ts, backend/src/app.ts
  mensagem de commit: "T-030 api-complementar: Gestão de Expediente e Bloqueios de Agenda"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa api-complementar T-030 concluida` após o commit.

#### Prompt — T-031

```
Você executa UMA tarefa da feature "api-complementar" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/api-complementar/spec.md, .spec/features/api-complementar/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-031 — "Listagem e Filtro de Transações Financeiras para o Extrato"
  critérios/refs: AC-047 (Listagem filtrada de movimentações de receitas e despesas)
  arquivos permitidos (e seus testes): backend/src/routes/financial.ts, backend/src/repositories/financial-repository.ts
  mensagem de commit: "T-031 api-complementar: Listagem e Filtro de Transações Financeiras para o Extrato"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa api-complementar T-031 concluida` após o commit.

#### Prompt — T-032

```
Você executa UMA tarefa da feature "api-complementar" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/api-complementar/spec.md, .spec/features/api-complementar/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-032 — "Suíte Integrada de Testes Automatizados TDD da API Complementar"
  critérios/refs: AC-041 (Login com sucesso gerando token JWT e dados do tenant), AC-042 (Rejeição de login com credenciais incorretas ou tenant inativo), AC-043 (Retorno delta incremental de mutações do servidor), AC-044 (Consulta de status da sessão WhatsApp e obtenção de QR Code), AC-045 (Consulta e atualização do expediente semanal de trabalho), AC-046 (Cadastro, listagem e remoção de bloqueios de agenda), AC-047 (Listagem filtrada de movimentações de receitas e despesas), AC-048 (Disponibilização e validação das regras de negócio em `@cliniassist/shared`)
  arquivos permitidos (e seus testes): backend/src/api-complementar/__tests__/api-complementar.spec.ts
  mensagem de commit: "T-032 api-complementar: Suíte Integrada de Testes Automatizados TDD da API Complementar"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa api-complementar T-032 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify api-complementar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-api-complementar-mvdxjs3f --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-api-complementar-mvdxjs3f --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo api-complementar --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo api-complementar --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

