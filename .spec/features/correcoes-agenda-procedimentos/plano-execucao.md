# Plano de execução — correcoes-agenda-procedimentos

> gerado por `onp-spec plano` em 2026-10-19 17:33 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano correcoes-agenda-procedimentos`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano correcoes-agenda-procedimentos --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/correcoes-agenda-procedimentos`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/correcoes-agenda-procedimentos-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-070 | Frontend: Reset de Ciclo de Vida da Gaveta de Criação Rápida | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx` |

#### faixa-2 — branch `spec/correcoes-agenda-procedimentos-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-071 | Frontend: Deduplicação e Seeds Determinísticos de Procedimentos | `claude-sonnet-5` | medium | `frontend/src/db/repositories/procedure-local-repository.ts`, `frontend/src/features/agenda/components/InlineProcedureForm.tsx` |

#### faixa-3 — branch `spec/correcoes-agenda-procedimentos-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-072 | Frontend: Ocupação Contínua de Horários em Consultas Longas no ScheduleGrid | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/ScheduleGrid.tsx` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/correcoes-agenda-procedimentos-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-073 | Frontend: Edição Interativa de Procedimentos na Gaveta de Detalhes | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx`, `frontend/src/App.tsx`, `frontend/src/db/repositories/appointment-local-repository.ts` |

#### faixa-5 — branch `spec/correcoes-agenda-procedimentos-faixa-5` — worktree `../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-074 | Testes Automatizados com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/agenda/__tests__/agenda-fixes-ui.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/correcoes-agenda-procedimentos` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify correcoes-agenda-procedimentos` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/correcoes-agenda-procedimentos   # ou: git checkout spec/correcoes-agenda-procedimentos
git worktree add ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-1 -b spec/correcoes-agenda-procedimentos-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-2 -b spec/correcoes-agenda-procedimentos-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-3 -b spec/correcoes-agenda-procedimentos-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-4 -b spec/correcoes-agenda-procedimentos-faixa-4
git worktree add ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-5 -b spec/correcoes-agenda-procedimentos-faixa-5
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "correcoes-agenda-procedimentos" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-1 (branch spec/correcoes-agenda-procedimentos-faixa-1) — já preparado.
Leia primeiro: .spec/features/correcoes-agenda-procedimentos/spec.md, .spec/features/correcoes-agenda-procedimentos/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-070 — "Frontend: Reset de Ciclo de Vida da Gaveta de Criação Rápida"
  critérios/refs: AC-089 (Reset completo de formulário e reativação do botão ao reabrir a gaveta)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx
  mensagem de commit: "T-070 correcoes-agenda-procedimentos: Frontend: Reset de Ciclo de Vida da Gaveta de Criação Rápida"

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
Você executa as tarefas da faixa-2 da feature "correcoes-agenda-procedimentos" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-2 (branch spec/correcoes-agenda-procedimentos-faixa-2) — já preparado.
Leia primeiro: .spec/features/correcoes-agenda-procedimentos/spec.md, .spec/features/correcoes-agenda-procedimentos/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-071 — "Frontend: Deduplicação e Seeds Determinísticos de Procedimentos"
  critérios/refs: AC-090 (Deduplicação idempotente e IDs determinísticos na lista de procedimentos)
  arquivos permitidos (e seus testes): frontend/src/db/repositories/procedure-local-repository.ts, frontend/src/features/agenda/components/InlineProcedureForm.tsx
  mensagem de commit: "T-071 correcoes-agenda-procedimentos: Frontend: Deduplicação e Seeds Determinísticos de Procedimentos"

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
Você executa as tarefas da faixa-3 da feature "correcoes-agenda-procedimentos" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-3 (branch spec/correcoes-agenda-procedimentos-faixa-3) — já preparado.
Leia primeiro: .spec/features/correcoes-agenda-procedimentos/spec.md, .spec/features/correcoes-agenda-procedimentos/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-072 — "Frontend: Ocupação Contínua de Horários em Consultas Longas no ScheduleGrid"
  critérios/refs: AC-091 (Bloqueio e cobertura visual contínua de slots intermediários em consultas longas)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/ScheduleGrid.tsx
  mensagem de commit: "T-072 correcoes-agenda-procedimentos: Frontend: Ocupação Contínua de Horários em Consultas Longas no ScheduleGrid"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
Quando a última tarefa estiver commitada, PARE e informe o resultado — a mesclagem é do orquestrador.
```

#### Prompt — faixa-4

```
Você executa as tarefas da faixa-4 da feature "correcoes-agenda-procedimentos" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-4 (branch spec/correcoes-agenda-procedimentos-faixa-4) — já preparado.
Leia primeiro: .spec/features/correcoes-agenda-procedimentos/spec.md, .spec/features/correcoes-agenda-procedimentos/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-073 — "Frontend: Edição Interativa de Procedimentos na Gaveta de Detalhes"
  critérios/refs: AC-092 (Edição interativa de procedimentos vinculados na consulta com recálculo de duração)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx, frontend/src/App.tsx, frontend/src/db/repositories/appointment-local-repository.ts
  mensagem de commit: "T-073 correcoes-agenda-procedimentos: Frontend: Edição Interativa de Procedimentos na Gaveta de Detalhes"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
Quando a última tarefa estiver commitada, PARE e informe o resultado — a mesclagem é do orquestrador.
```

#### Prompt — faixa-5

```
Você executa as tarefas da faixa-5 da feature "correcoes-agenda-procedimentos" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-5 (branch spec/correcoes-agenda-procedimentos-faixa-5) — já preparado.
Leia primeiro: .spec/features/correcoes-agenda-procedimentos/spec.md, .spec/features/correcoes-agenda-procedimentos/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-074 — "Testes Automatizados com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-089 (Reset completo de formulário e reativação do botão ao reabrir a gaveta), AC-090 (Deduplicação idempotente e IDs determinísticos na lista de procedimentos), AC-091 (Bloqueio e cobertura visual contínua de slots intermediários em consultas longas), AC-092 (Edição interativa de procedimentos vinculados na consulta com recálculo de duração)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/__tests__/agenda-fixes-ui.spec.tsx
  mensagem de commit: "T-074 correcoes-agenda-procedimentos: Testes Automatizados com Prova Mecânica e Auditoria CI"

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
git merge --no-ff spec/correcoes-agenda-procedimentos-faixa-1 -m "merge faixa-1 (correcoes-agenda-procedimentos)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-1 && git branch -d spec/correcoes-agenda-procedimentos-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcoes-agenda-procedimentos T-070 concluida
git merge --no-ff spec/correcoes-agenda-procedimentos-faixa-2 -m "merge faixa-2 (correcoes-agenda-procedimentos)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-2 && git branch -d spec/correcoes-agenda-procedimentos-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcoes-agenda-procedimentos T-071 concluida
git merge --no-ff spec/correcoes-agenda-procedimentos-faixa-3 -m "merge faixa-3 (correcoes-agenda-procedimentos)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-3 && git branch -d spec/correcoes-agenda-procedimentos-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcoes-agenda-procedimentos T-072 concluida
git merge --no-ff spec/correcoes-agenda-procedimentos-faixa-4 -m "merge faixa-4 (correcoes-agenda-procedimentos)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-4 && git branch -d spec/correcoes-agenda-procedimentos-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcoes-agenda-procedimentos T-073 concluida
git merge --no-ff spec/correcoes-agenda-procedimentos-faixa-5 -m "merge faixa-5 (correcoes-agenda-procedimentos)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-procedimentos-faixa-5 && git branch -d spec/correcoes-agenda-procedimentos-faixa-5
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcoes-agenda-procedimentos T-074 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify correcoes-agenda-procedimentos
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-correcoes-agenda-procedimentos-mvfj9k4u --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-correcoes-agenda-procedimentos-mvfj9k4u --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo correcoes-agenda-procedimentos --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo correcoes-agenda-procedimentos --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

