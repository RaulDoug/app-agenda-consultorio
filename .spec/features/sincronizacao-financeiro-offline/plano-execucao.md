# Plano de execução — sincronizacao-financeiro-offline

> gerado por `onp-spec plano` em 2026-10-21 17:17 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano sincronizacao-financeiro-offline`

## Resumo — o que vai acontecer

- **4 tarefa(s) pendente(s)**: 4 em 3 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano sincronizacao-financeiro-offline --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/sincronizacao-financeiro-offline`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/sincronizacao-financeiro-offline-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-001 | Ingestão e Upsert de Transações Financeiras com LWW no Sync Batch | `claude-sonnet-5` | medium | `backend/src/routes/sync.ts` |
| T-002 | Suporte a Procedimentos Cadastrados Offline no Sync Batch | `claude-sonnet-5` | medium | `backend/src/routes/sync.ts` |

#### faixa-2 — branch `spec/sincronizacao-financeiro-offline-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-003 | Blindagem de Sincronização e Restauração no Frontend | `claude-sonnet-5` | medium | `frontend/src/sync/sync-manager.ts`, `frontend/src/features/auth/hooks/AuthContext.tsx` |

#### faixa-3 — branch `spec/sincronizacao-financeiro-offline-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-004 | Suíte de Testes Automatizados TDD Integrada e Prova Mecânica | `claude-sonnet-5` | medium | `backend/src/routes/__tests__/sincronizacao-financeiro-offline.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/sincronizacao-financeiro-offline` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify sincronizacao-financeiro-offline` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/sincronizacao-financeiro-offline   # ou: git checkout spec/sincronizacao-financeiro-offline
git worktree add ../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-1 -b spec/sincronizacao-financeiro-offline-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-2 -b spec/sincronizacao-financeiro-offline-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-3 -b spec/sincronizacao-financeiro-offline-faixa-3
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "sincronizacao-financeiro-offline" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-1 (branch spec/sincronizacao-financeiro-offline-faixa-1) — já preparado.
Leia primeiro: .spec/features/sincronizacao-financeiro-offline/spec.md, .spec/features/sincronizacao-financeiro-offline/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-001 — "Ingestão e Upsert de Transações Financeiras com LWW no Sync Batch"
  critérios/refs: AC-193 (Ingestão e persistência de transações financeiras em lote no backend via POST /api/sync/batch), AC-194 (Resolução de conflitos Last-Write-Wins e exclusão lógica de transações financeiras no sync/batch)
  arquivos permitidos (e seus testes): backend/src/routes/sync.ts
  mensagem de commit: "T-001 sincronizacao-financeiro-offline: Ingestão e Upsert de Transações Financeiras com LWW no Sync Batch"
T-002 — "Suporte a Procedimentos Cadastrados Offline no Sync Batch"
  critérios/refs: AC-193 (Ingestão e persistência de transações financeiras em lote no backend via POST /api/sync/batch)
  arquivos permitidos (e seus testes): backend/src/routes/sync.ts
  mensagem de commit: "T-002 sincronizacao-financeiro-offline: Suporte a Procedimentos Cadastrados Offline no Sync Batch"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
Quando a última tarefa estiver commitada, PARE e informe o resultado — a mesclagem é do orquestrador.
```

#### Prompt — faixa-2

```
Você executa as tarefas da faixa-2 da feature "sincronizacao-financeiro-offline" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-2 (branch spec/sincronizacao-financeiro-offline-faixa-2) — já preparado.
Leia primeiro: .spec/features/sincronizacao-financeiro-offline/spec.md, .spec/features/sincronizacao-financeiro-offline/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-003 — "Blindagem de Sincronização e Restauração no Frontend"
  critérios/refs: AC-195 (Restauração íntegra de transações financeiras no GET /api/sync/pull após novo login)
  arquivos permitidos (e seus testes): frontend/src/sync/sync-manager.ts, frontend/src/features/auth/hooks/AuthContext.tsx
  mensagem de commit: "T-003 sincronizacao-financeiro-offline: Blindagem de Sincronização e Restauração no Frontend"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
Quando a última tarefa estiver commitada, PARE e informe o resultado — a mesclagem é do orquestrador.
```

#### Prompt — faixa-3

```
Você executa as tarefas da faixa-3 da feature "sincronizacao-financeiro-offline" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-3 (branch spec/sincronizacao-financeiro-offline-faixa-3) — já preparado.
Leia primeiro: .spec/features/sincronizacao-financeiro-offline/spec.md, .spec/features/sincronizacao-financeiro-offline/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-004 — "Suíte de Testes Automatizados TDD Integrada e Prova Mecânica"
  critérios/refs: AC-193 (Ingestão e persistência de transações financeiras em lote no backend via POST /api/sync/batch), AC-194 (Resolução de conflitos Last-Write-Wins e exclusão lógica de transações financeiras no sync/batch), AC-195 (Restauração íntegra de transações financeiras no GET /api/sync/pull após novo login)
  arquivos permitidos (e seus testes): backend/src/routes/__tests__/sincronizacao-financeiro-offline.spec.ts
  mensagem de commit: "T-004 sincronizacao-financeiro-offline: Suíte de Testes Automatizados TDD Integrada e Prova Mecânica"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
Quando a última tarefa estiver commitada, PARE e informe o resultado — a mesclagem é do orquestrador.
```

3. **Todas terminaram? Mescle na ordem e marque as tarefas** (na árvore principal):

```bash
git merge --no-ff spec/sincronizacao-financeiro-offline-faixa-1 -m "merge faixa-1 (sincronizacao-financeiro-offline)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-1 && git branch -d spec/sincronizacao-financeiro-offline-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa sincronizacao-financeiro-offline T-001 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa sincronizacao-financeiro-offline T-002 concluida
git merge --no-ff spec/sincronizacao-financeiro-offline-faixa-2 -m "merge faixa-2 (sincronizacao-financeiro-offline)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-2 && git branch -d spec/sincronizacao-financeiro-offline-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa sincronizacao-financeiro-offline T-003 concluida
git merge --no-ff spec/sincronizacao-financeiro-offline-faixa-3 -m "merge faixa-3 (sincronizacao-financeiro-offline)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-sincronizacao-financeiro-offline-faixa-3 && git branch -d spec/sincronizacao-financeiro-offline-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa sincronizacao-financeiro-offline T-004 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify sincronizacao-financeiro-offline
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-sincronizacao-financeiro-offline-mvidkz6j --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-sincronizacao-financeiro-offline-mvidkz6j --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo sincronizacao-financeiro-offline --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo sincronizacao-financeiro-offline --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

