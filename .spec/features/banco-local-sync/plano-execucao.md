# Plano de execução — banco-local-sync

> gerado por `onp-spec plano` em 2026-10-18 15:24 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano banco-local-sync --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 4 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/banco-local-sync`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-036 | Definição do Schema Dexie.js e Inicialização do Banco Local | `claude-sonnet-5` | medium |
| T-037 | Escrita Otimista com Enfileiramento na Outbox | `claude-sonnet-5` | medium |
| T-038 | Sincronizador Bidirecional, Poda de Cache e Hook de Conexão | `claude-sonnet-5` | medium |
| T-039 | Suíte de Testes Automatizados TDD do Banco Local e Sincronização | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/banco-local-sync` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify banco-local-sync` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/banco-local-sync   # ou: git checkout spec/banco-local-sync
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-036

```
Você executa UMA tarefa da feature "banco-local-sync" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/banco-local-sync/spec.md, .spec/features/banco-local-sync/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-036 — "Definição do Schema Dexie.js e Inicialização do Banco Local"
  critérios/refs: AC-053 (Inicialização do schema Dexie.js e tabelas locais)
  arquivos permitidos (e seus testes): frontend/src/db/local-db.ts, frontend/src/db/types.ts
  mensagem de commit: "T-036 banco-local-sync: Definição do Schema Dexie.js e Inicialização do Banco Local"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa banco-local-sync T-036 concluida` após o commit.

#### Prompt — T-037

```
Você executa UMA tarefa da feature "banco-local-sync" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/banco-local-sync/spec.md, .spec/features/banco-local-sync/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-037 — "Escrita Otimista com Enfileiramento na Outbox"
  critérios/refs: AC-054 (Escrita otimista no banco local e enfileiramento na outbox)
  arquivos permitidos (e seus testes): frontend/src/db/outbox.ts, frontend/src/db/repositories/appointment-local-repository.ts, frontend/src/db/repositories/patient-local-repository.ts
  mensagem de commit: "T-037 banco-local-sync: Escrita Otimista com Enfileiramento na Outbox"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa banco-local-sync T-037 concluida` após o commit.

#### Prompt — T-038

```
Você executa UMA tarefa da feature "banco-local-sync" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/banco-local-sync/spec.md, .spec/features/banco-local-sync/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-038 — "Sincronizador Bidirecional, Poda de Cache e Hook de Conexão"
  critérios/refs: AC-055 (Sincronização bidirecional (Push e Pull Delta) com resiliência a falhas), AC-056 (Poda automática de histórico antigo e hook de conexão reativo)
  arquivos permitidos (e seus testes): frontend/src/sync/sync-manager.ts, frontend/src/sync/pruning.ts, frontend/src/hooks/useConnectionStatus.ts
  mensagem de commit: "T-038 banco-local-sync: Sincronizador Bidirecional, Poda de Cache e Hook de Conexão"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa banco-local-sync T-038 concluida` após o commit.

#### Prompt — T-039

```
Você executa UMA tarefa da feature "banco-local-sync" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/banco-local-sync/spec.md, .spec/features/banco-local-sync/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-039 — "Suíte de Testes Automatizados TDD do Banco Local e Sincronização"
  critérios/refs: AC-053 (Inicialização do schema Dexie.js e tabelas locais), AC-054 (Escrita otimista no banco local e enfileiramento na outbox), AC-055 (Sincronização bidirecional (Push e Pull Delta) com resiliência a falhas), AC-056 (Poda automática de histórico antigo e hook de conexão reativo)
  arquivos permitidos (e seus testes): frontend/src/db/__tests__/local-db.spec.ts
  mensagem de commit: "T-039 banco-local-sync: Suíte de Testes Automatizados TDD do Banco Local e Sincronização"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa banco-local-sync T-039 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify banco-local-sync
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-banco-local-sync-mvdz7el0 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-banco-local-sync-mvdz7el0 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo banco-local-sync --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo banco-local-sync --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

