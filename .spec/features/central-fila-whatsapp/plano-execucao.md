# Plano de execução — central-fila-whatsapp

> gerado por `onp-spec plano` em 2026-10-27 14:29 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano central-fila-whatsapp`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano central-fila-whatsapp --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/central-fila-whatsapp`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/central-fila-whatsapp-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-138 | Contratos Compartilhados e Migração de Schema para Fila WhatsApp | `claude-sonnet-5` | medium | `shared/src/types/whatsapp.ts`, `shared/src/index.ts`, `backend/src/db/schema.sql`, `backend/src/db/migrations/003_whatsapp_queue_columns.sql` |

#### faixa-2 — branch `spec/central-fila-whatsapp-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-139 | Repositório SQL e Métodos de Fila BullMQ com Isolamento Multi-Tenant | `claude-sonnet-5` | medium | `backend/src/repositories/whatsapp-repository.ts`, `backend/src/whatsapp/queue.ts`, `backend/src/repositories/__tests__/whatsapp-repository.spec.ts` |

#### faixa-3 — branch `spec/central-fila-whatsapp-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-140 | Services, Controllers e Rotas REST da Central de Fila | `claude-sonnet-5` | medium | `backend/src/services/whatsapp-service.ts`, `backend/src/services/whatsapp-scheduler-service.ts`, `backend/src/controllers/whatsapp-controller.ts`, `backend/src/routes/whatsapp.routes.ts`, `backend/src/services/__tests__/whatsapp-service.spec.ts`, `backend/src/controllers/__tests__/whatsapp-controller.spec.ts` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/central-fila-whatsapp-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-141 | Componentes da Central de Fila com Drag & Drop, Filtros e Modais | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/components/WhatsappQueueView.tsx`, `frontend/src/features/whatsapp/components/EditQueueMessageDrawer.tsx`, `frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx`, `frontend/src/features/whatsapp/hooks/useWhatsappQueue.ts`, `frontend/src/features/whatsapp/services/whatsapp-queue-api.ts`, `frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx` |

#### faixa-5 — branch `spec/central-fila-whatsapp-faixa-5` — worktree `../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-142 | Integração no MoreMenuHub, App.tsx, Desktop e Auditoria de Ponta a Ponta | `claude-sonnet-5` | medium | `frontend/src/components/layout/BottomNav.tsx`, `frontend/src/components/layout/MoreMenuHub.tsx`, `frontend/src/App.tsx`, `frontend/src/features/whatsapp/__tests__/WhatsappNavigation.spec.tsx`, `docs/backend/funcionalidades/whatsapp_evolution.md`, `docs/frontend/funcionalidades/whatsapp_conexao_qrcode.md` |

## Gestão de branches e commits

1. branch de trabalho `spec/central-fila-whatsapp` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify central-fila-whatsapp` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/central-fila-whatsapp   # ou: git checkout spec/central-fila-whatsapp
git worktree add ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-1 -b spec/central-fila-whatsapp-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-2 -b spec/central-fila-whatsapp-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-3 -b spec/central-fila-whatsapp-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-4 -b spec/central-fila-whatsapp-faixa-4
git worktree add ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-5 -b spec/central-fila-whatsapp-faixa-5
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "central-fila-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-1 (branch spec/central-fila-whatsapp-faixa-1) — já preparado.
Leia primeiro: .spec/features/central-fila-whatsapp/spec.md, .spec/features/central-fila-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-138 — "Contratos Compartilhados e Migração de Schema para Fila WhatsApp"
  critérios/refs: AC-209 (Listagem da fila com categorização semântica e isolamento multi-tenant), AC-211 (Exclusão lógica da fila de envio automático sem cancelar agendamento), AC-212 (Edição manual da mensagem individual da consulta), AC-213 (Reordenação da fila com persistência de ordem), AC-214 (Disparo imediato sob demanda com cancelamento da fila automática)
  arquivos permitidos (e seus testes): shared/src/types/whatsapp.ts, shared/src/index.ts, backend/src/db/schema.sql, backend/src/db/migrations/003_whatsapp_queue_columns.sql
  mensagem de commit: "T-138 central-fila-whatsapp: Contratos Compartilhados e Migração de Schema para Fila WhatsApp"

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
Você executa as tarefas da faixa-2 da feature "central-fila-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-2 (branch spec/central-fila-whatsapp-faixa-2) — já preparado.
Leia primeiro: .spec/features/central-fila-whatsapp/spec.md, .spec/features/central-fila-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-139 — "Repositório SQL e Métodos de Fila BullMQ com Isolamento Multi-Tenant"
  critérios/refs: AC-209 (Listagem da fila com categorização semântica e isolamento multi-tenant), AC-211 (Exclusão lógica da fila de envio automático sem cancelar agendamento), AC-212 (Edição manual da mensagem individual da consulta), AC-213 (Reordenação da fila com persistência de ordem)
  arquivos permitidos (e seus testes): backend/src/repositories/whatsapp-repository.ts, backend/src/whatsapp/queue.ts, backend/src/repositories/__tests__/whatsapp-repository.spec.ts
  mensagem de commit: "T-139 central-fila-whatsapp: Repositório SQL e Métodos de Fila BullMQ com Isolamento Multi-Tenant"

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
Você executa as tarefas da faixa-3 da feature "central-fila-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-3 (branch spec/central-fila-whatsapp-faixa-3) — já preparado.
Leia primeiro: .spec/features/central-fila-whatsapp/spec.md, .spec/features/central-fila-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-140 — "Services, Controllers e Rotas REST da Central de Fila"
  critérios/refs: AC-209 (Listagem da fila com categorização semântica e isolamento multi-tenant), AC-211 (Exclusão lógica da fila de envio automático sem cancelar agendamento), AC-212 (Edição manual da mensagem individual da consulta), AC-213 (Reordenação da fila com persistência de ordem), AC-214 (Disparo imediato sob demanda com cancelamento da fila automática), AC-215 (Recepção e processamento de confirmação após envio manual), AC-216 (Disparo em lote imediato, pausa/retomada e configuração de templates)
  arquivos permitidos (e seus testes): backend/src/services/whatsapp-service.ts, backend/src/services/whatsapp-scheduler-service.ts, backend/src/controllers/whatsapp-controller.ts, backend/src/routes/whatsapp.routes.ts, backend/src/services/__tests__/whatsapp-service.spec.ts, backend/src/controllers/__tests__/whatsapp-controller.spec.ts
  mensagem de commit: "T-140 central-fila-whatsapp: Services, Controllers e Rotas REST da Central de Fila"

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
Você executa as tarefas da faixa-4 da feature "central-fila-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-4 (branch spec/central-fila-whatsapp-faixa-4) — já preparado.
Leia primeiro: .spec/features/central-fila-whatsapp/spec.md, .spec/features/central-fila-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-141 — "Componentes da Central de Fila com Drag & Drop, Filtros e Modais"
  critérios/refs: AC-209 (Listagem da fila com categorização semântica e isolamento multi-tenant), AC-210 (Exibição de resposta do paciente com atalho para conversa direta no WhatsApp), AC-211 (Exclusão lógica da fila de envio automático sem cancelar agendamento), AC-212 (Edição manual da mensagem individual da consulta), AC-213 (Reordenação da fila com persistência de ordem), AC-214 (Disparo imediato sob demanda com cancelamento da fila automática), AC-216 (Disparo em lote imediato, pausa/retomada e configuração de templates)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/components/EditQueueMessageDrawer.tsx, frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx, frontend/src/features/whatsapp/hooks/useWhatsappQueue.ts, frontend/src/features/whatsapp/services/whatsapp-queue-api.ts, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
  mensagem de commit: "T-141 central-fila-whatsapp: Componentes da Central de Fila com Drag & Drop, Filtros e Modais"

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
Você executa as tarefas da faixa-5 da feature "central-fila-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-5 (branch spec/central-fila-whatsapp-faixa-5) — já preparado.
Leia primeiro: .spec/features/central-fila-whatsapp/spec.md, .spec/features/central-fila-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-142 — "Integração no MoreMenuHub, App.tsx, Desktop e Auditoria de Ponta a Ponta"
  critérios/refs: AC-217 (Navegação para a tela da Fila WhatsApp a partir do menu Mais)
  arquivos permitidos (e seus testes): frontend/src/components/layout/BottomNav.tsx, frontend/src/components/layout/MoreMenuHub.tsx, frontend/src/App.tsx, frontend/src/features/whatsapp/__tests__/WhatsappNavigation.spec.tsx, docs/backend/funcionalidades/whatsapp_evolution.md, docs/frontend/funcionalidades/whatsapp_conexao_qrcode.md
  mensagem de commit: "T-142 central-fila-whatsapp: Integração no MoreMenuHub, App.tsx, Desktop e Auditoria de Ponta a Ponta"

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
git merge --no-ff spec/central-fila-whatsapp-faixa-1 -m "merge faixa-1 (central-fila-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-1 && git branch -d spec/central-fila-whatsapp-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa central-fila-whatsapp T-138 concluida
git merge --no-ff spec/central-fila-whatsapp-faixa-2 -m "merge faixa-2 (central-fila-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-2 && git branch -d spec/central-fila-whatsapp-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa central-fila-whatsapp T-139 concluida
git merge --no-ff spec/central-fila-whatsapp-faixa-3 -m "merge faixa-3 (central-fila-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-3 && git branch -d spec/central-fila-whatsapp-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa central-fila-whatsapp T-140 concluida
git merge --no-ff spec/central-fila-whatsapp-faixa-4 -m "merge faixa-4 (central-fila-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-4 && git branch -d spec/central-fila-whatsapp-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa central-fila-whatsapp T-141 concluida
git merge --no-ff spec/central-fila-whatsapp-faixa-5 -m "merge faixa-5 (central-fila-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-central-fila-whatsapp-faixa-5 && git branch -d spec/central-fila-whatsapp-faixa-5
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa central-fila-whatsapp T-142 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify central-fila-whatsapp
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-central-fila-whatsapp-mvqs7kp2 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-central-fila-whatsapp-mvqs7kp2 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo central-fila-whatsapp --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo central-fila-whatsapp --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

