# Plano de execução — persistencia-api

> gerado por `onp-spec plano` em 2026-10-17 19:22 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano persistencia-api`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 2 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano persistencia-api --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/persistencia-api`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/persistencia-api-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-persistencia-api-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-008 | Infraestrutura SQL: Schema DDL e Gerenciador de Conexão com Postgres | `claude-sonnet-5` | medium | `backend/src/db/schema.sql`, `backend/src/db/connection.ts` |

#### faixa-2 — branch `spec/persistencia-api-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-persistencia-api-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-009 | Middleware de Autenticação JWT e Contexto Multi-Tenant | `claude-sonnet-5` | medium | `backend/src/middlewares/auth.ts`, `backend/src/routes/__tests__/api.spec.ts` |
| T-010 | Repositórios SQL e Rotas de Pacientes e Procedimentos | `claude-sonnet-5` | medium | `backend/src/repositories/patient-repository.ts`, `backend/src/repositories/procedure-repository.ts`, `backend/src/routes/patients.ts`, `backend/src/routes/procedures.ts`, `backend/src/routes/__tests__/api.spec.ts` |
| T-011 | Repositório Transacional e Rotas de Agendamentos | `claude-sonnet-5` | medium | `backend/src/repositories/appointment-repository.ts`, `backend/src/routes/appointments.ts`, `backend/src/routes/__tests__/api.spec.ts` |
| T-012 | Rota de Sincronização em Lote Offline-First e Setup do App Express | `claude-sonnet-5` | medium | `backend/src/routes/sync.ts`, `backend/src/app.ts`, `backend/src/routes/__tests__/api.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/persistencia-api` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify persistencia-api` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/persistencia-api   # ou: git checkout spec/persistencia-api
git worktree add ../onp-worktrees/App-Agenda-Consultório-persistencia-api-faixa-1 -b spec/persistencia-api-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-persistencia-api-faixa-2 -b spec/persistencia-api-faixa-2
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "persistencia-api" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-persistencia-api-faixa-1 (branch spec/persistencia-api-faixa-1) — já preparado.
Leia primeiro: .spec/features/persistencia-api/spec.md, .spec/features/persistencia-api/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-008 — "Infraestrutura SQL: Schema DDL e Gerenciador de Conexão com Postgres"
  critérios/refs: US-007, US-008, US-009, US-010
  arquivos permitidos (e seus testes): backend/src/db/schema.sql, backend/src/db/connection.ts
  mensagem de commit: "T-008 persistencia-api: Infraestrutura SQL: Schema DDL e Gerenciador de Conexão com Postgres"

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
Você executa as tarefas da faixa-2 da feature "persistencia-api" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-persistencia-api-faixa-2 (branch spec/persistencia-api-faixa-2) — já preparado.
Leia primeiro: .spec/features/persistencia-api/spec.md, .spec/features/persistencia-api/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-009 — "Middleware de Autenticação JWT e Contexto Multi-Tenant"
  critérios/refs: AC-011 (Rejeição de requisições sem token de autenticação), AC-012 (Isolamento estrito entre diferentes consultórios)
  arquivos permitidos (e seus testes): backend/src/middlewares/auth.ts, backend/src/routes/__tests__/api.spec.ts
  mensagem de commit: "T-009 persistencia-api: Middleware de Autenticação JWT e Contexto Multi-Tenant"
T-010 — "Repositórios SQL e Rotas de Pacientes e Procedimentos"
  critérios/refs: AC-013 (Proteção contra injeção SQL em buscas), AC-014 (Soft Delete em remoção de pacientes)
  arquivos permitidos (e seus testes): backend/src/repositories/patient-repository.ts, backend/src/repositories/procedure-repository.ts, backend/src/routes/patients.ts, backend/src/routes/procedures.ts, backend/src/routes/__tests__/api.spec.ts
  mensagem de commit: "T-010 persistencia-api: Repositórios SQL e Rotas de Pacientes e Procedimentos"
T-011 — "Repositório Transacional e Rotas de Agendamentos"
  critérios/refs: AC-015 (Inserção transacional com rollback automático), AC-016 (Prevenção de conflito de horário (Double Booking))
  arquivos permitidos (e seus testes): backend/src/repositories/appointment-repository.ts, backend/src/routes/appointments.ts, backend/src/routes/__tests__/api.spec.ts
  mensagem de commit: "T-011 persistencia-api: Repositório Transacional e Rotas de Agendamentos"
T-012 — "Rota de Sincronização em Lote Offline-First e Setup do App Express"
  critérios/refs: AC-017 (Processamento idempotente de lote de sincronização), AC-018 (Resolução de conflito Last-Write-Wins)
  arquivos permitidos (e seus testes): backend/src/routes/sync.ts, backend/src/app.ts, backend/src/routes/__tests__/api.spec.ts
  mensagem de commit: "T-012 persistencia-api: Rota de Sincronização em Lote Offline-First e Setup do App Express"

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
git merge --no-ff spec/persistencia-api-faixa-1 -m "merge faixa-1 (persistencia-api)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-persistencia-api-faixa-1 && git branch -d spec/persistencia-api-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa persistencia-api T-008 concluida
git merge --no-ff spec/persistencia-api-faixa-2 -m "merge faixa-2 (persistencia-api)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-persistencia-api-faixa-2 && git branch -d spec/persistencia-api-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa persistencia-api T-009 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa persistencia-api T-010 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa persistencia-api T-011 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa persistencia-api T-012 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify persistencia-api
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-persistencia-api-mvcs9lir --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-persistencia-api-mvcs9lir --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo persistencia-api --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo persistencia-api --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

