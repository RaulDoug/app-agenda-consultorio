# Plano de execução — automacao-whatsapp-evolution

> gerado por `onp-spec plano` em 2026-10-20 18:44 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano automacao-whatsapp-evolution`

## Resumo — o que vai acontecer

- **6 tarefa(s) pendente(s)**: 6 em 6 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano automacao-whatsapp-evolution --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/automacao-whatsapp-evolution`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/automacao-whatsapp-evolution-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-127 | DDL, Migrations e Contratos Compartilhados | `claude-sonnet-5` | medium | `backend/src/db/schema.sql`, `shared/src/types/whatsapp.ts`, `shared/src/index.ts` |

#### faixa-2 — branch `spec/automacao-whatsapp-evolution-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-128 | Camada de Repositórios SQL do WhatsApp | `claude-sonnet-5` | medium | `backend/src/repositories/whatsapp-repository.ts`, `backend/src/repositories/__tests__/whatsapp-repository.spec.ts` |

#### faixa-3 — branch `spec/automacao-whatsapp-evolution-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-129 | Camada de Serviços de Negócio e Scheduler Diário | `claude-sonnet-5` | medium | `backend/src/services/whatsapp-service.ts`, `backend/src/services/whatsapp-scheduler-service.ts`, `backend/src/services/webhook-service.ts`, `backend/src/services/__tests__/whatsapp-service.spec.ts`, `backend/src/services/__tests__/whatsapp-scheduler-service.spec.ts` |

### Onda 2 — faixa-4 ∥ faixa-5 ∥ faixa-6

#### faixa-4 — branch `spec/automacao-whatsapp-evolution-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-130 | Camada de Controllers HTTP e Validações | `claude-sonnet-5` | medium | `backend/src/controllers/whatsapp-controller.ts`, `backend/src/controllers/webhook-controller.ts`, `backend/src/controllers/__tests__/whatsapp-controller.spec.ts`, `backend/src/controllers/__tests__/webhook-controller.spec.ts` |

#### faixa-5 — branch `spec/automacao-whatsapp-evolution-faixa-5` — worktree `../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-131 | Rotas REST, Registro no Express e Suíte Integrada | `claude-sonnet-5` | medium | `backend/src/routes/whatsapp.routes.ts`, `backend/src/routes/webhooks.routes.ts`, `backend/src/routes/__tests__/whatsapp.routes.spec.ts`, `backend/src/routes/__tests__/webhooks.routes.spec.ts`, `backend/src/app.ts` |

#### faixa-6 — branch `spec/automacao-whatsapp-evolution-faixa-6` — worktree `../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-6`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-132 | Documentação Técnica do Subsistema de WhatsApp | `claude-sonnet-5` | medium | `docs/backend/funcionalidades/whatsapp_evolution.md`, `docs/backend/funcionalidades/regras_globais.md` |

## Gestão de branches e commits

1. branch de trabalho `spec/automacao-whatsapp-evolution` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify automacao-whatsapp-evolution` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/automacao-whatsapp-evolution   # ou: git checkout spec/automacao-whatsapp-evolution
git worktree add ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-1 -b spec/automacao-whatsapp-evolution-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-2 -b spec/automacao-whatsapp-evolution-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-3 -b spec/automacao-whatsapp-evolution-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-4 -b spec/automacao-whatsapp-evolution-faixa-4
git worktree add ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-5 -b spec/automacao-whatsapp-evolution-faixa-5
git worktree add ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-6 -b spec/automacao-whatsapp-evolution-faixa-6
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "automacao-whatsapp-evolution" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-1 (branch spec/automacao-whatsapp-evolution-faixa-1) — já preparado.
Leia primeiro: .spec/features/automacao-whatsapp-evolution/spec.md, .spec/features/automacao-whatsapp-evolution/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-127 — "DDL, Migrations e Contratos Compartilhados"
  critérios/refs: AC-146 (Consulta de configurações de WhatsApp por consultório com auto-seed), AC-148 (Persistência de logs de mensagens enviadas e recebidas com status da Evolution API)
  arquivos permitidos (e seus testes): backend/src/db/schema.sql, shared/src/types/whatsapp.ts, shared/src/index.ts
  mensagem de commit: "T-127 automacao-whatsapp-evolution: DDL, Migrations e Contratos Compartilhados"

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
Você executa as tarefas da faixa-2 da feature "automacao-whatsapp-evolution" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-2 (branch spec/automacao-whatsapp-evolution-faixa-2) — já preparado.
Leia primeiro: .spec/features/automacao-whatsapp-evolution/spec.md, .spec/features/automacao-whatsapp-evolution/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-128 — "Camada de Repositórios SQL do WhatsApp"
  critérios/refs: AC-146 (Consulta de configurações de WhatsApp por consultório com auto-seed), AC-147 (Atualização de templates Spintax e preferências de envio), AC-148 (Persistência de logs de mensagens enviadas e recebidas com status da Evolution API), AC-149 (Consulta filtrada de histórico de mensagens por agendamento ou paciente), AC-150 (Desacoplamento estrito em Controller, Service e Repository com cobertura de testes unitários)
  arquivos permitidos (e seus testes): backend/src/repositories/whatsapp-repository.ts, backend/src/repositories/__tests__/whatsapp-repository.spec.ts
  mensagem de commit: "T-128 automacao-whatsapp-evolution: Camada de Repositórios SQL do WhatsApp"

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
Você executa as tarefas da faixa-3 da feature "automacao-whatsapp-evolution" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-3 (branch spec/automacao-whatsapp-evolution-faixa-3) — já preparado.
Leia primeiro: .spec/features/automacao-whatsapp-evolution/spec.md, .spec/features/automacao-whatsapp-evolution/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-129 — "Camada de Serviços de Negócio e Scheduler Diário"
  critérios/refs: AC-144 (Varredura de consultas pendentes para o dia seguinte e agendamento em lote com jitter anti-ban), AC-146 (Consulta de configurações de WhatsApp por consultório com auto-seed), AC-147 (Atualização de templates Spintax e preferências de envio), AC-148 (Persistência de logs de mensagens enviadas e recebidas com status da Evolution API), AC-150 (Desacoplamento estrito em Controller, Service e Repository com cobertura de testes unitários)
  arquivos permitidos (e seus testes): backend/src/services/whatsapp-service.ts, backend/src/services/whatsapp-scheduler-service.ts, backend/src/services/webhook-service.ts, backend/src/services/__tests__/whatsapp-service.spec.ts, backend/src/services/__tests__/whatsapp-scheduler-service.spec.ts
  mensagem de commit: "T-129 automacao-whatsapp-evolution: Camada de Serviços de Negócio e Scheduler Diário"

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
Você executa as tarefas da faixa-4 da feature "automacao-whatsapp-evolution" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-4 (branch spec/automacao-whatsapp-evolution-faixa-4) — já preparado.
Leia primeiro: .spec/features/automacao-whatsapp-evolution/spec.md, .spec/features/automacao-whatsapp-evolution/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-130 — "Camada de Controllers HTTP e Validações"
  critérios/refs: AC-145 (Disparo manual sob demanda de lote de confirmações via API), AC-146 (Consulta de configurações de WhatsApp por consultório com auto-seed), AC-147 (Atualização de templates Spintax e preferências de envio), AC-149 (Consulta filtrada de histórico de mensagens por agendamento ou paciente), AC-150 (Desacoplamento estrito em Controller, Service e Repository com cobertura de testes unitários)
  arquivos permitidos (e seus testes): backend/src/controllers/whatsapp-controller.ts, backend/src/controllers/webhook-controller.ts, backend/src/controllers/__tests__/whatsapp-controller.spec.ts, backend/src/controllers/__tests__/webhook-controller.spec.ts
  mensagem de commit: "T-130 automacao-whatsapp-evolution: Camada de Controllers HTTP e Validações"

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
Você executa as tarefas da faixa-5 da feature "automacao-whatsapp-evolution" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-5 (branch spec/automacao-whatsapp-evolution-faixa-5) — já preparado.
Leia primeiro: .spec/features/automacao-whatsapp-evolution/spec.md, .spec/features/automacao-whatsapp-evolution/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-131 — "Rotas REST, Registro no Express e Suíte Integrada"
  critérios/refs: AC-144 (Varredura de consultas pendentes para o dia seguinte e agendamento em lote com jitter anti-ban), AC-145 (Disparo manual sob demanda de lote de confirmações via API), AC-146 (Consulta de configurações de WhatsApp por consultório com auto-seed), AC-147 (Atualização de templates Spintax e preferências de envio), AC-148 (Persistência de logs de mensagens enviadas e recebidas com status da Evolution API), AC-149 (Consulta filtrada de histórico de mensagens por agendamento ou paciente), AC-150 (Desacoplamento estrito em Controller, Service e Repository com cobertura de testes unitários)
  arquivos permitidos (e seus testes): backend/src/routes/whatsapp.routes.ts, backend/src/routes/webhooks.routes.ts, backend/src/routes/__tests__/whatsapp.routes.spec.ts, backend/src/routes/__tests__/webhooks.routes.spec.ts, backend/src/app.ts
  mensagem de commit: "T-131 automacao-whatsapp-evolution: Rotas REST, Registro no Express e Suíte Integrada"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
Quando a última tarefa estiver commitada, PARE e informe o resultado — a mesclagem é do orquestrador.
```

#### Prompt — faixa-6

```
Você executa as tarefas da faixa-6 da feature "automacao-whatsapp-evolution" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-6 (branch spec/automacao-whatsapp-evolution-faixa-6) — já preparado.
Leia primeiro: .spec/features/automacao-whatsapp-evolution/spec.md, .spec/features/automacao-whatsapp-evolution/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-132 — "Documentação Técnica do Subsistema de WhatsApp"
  critérios/refs: AC-150 (Desacoplamento estrito em Controller, Service e Repository com cobertura de testes unitários)
  arquivos permitidos (e seus testes): docs/backend/funcionalidades/whatsapp_evolution.md, docs/backend/funcionalidades/regras_globais.md
  mensagem de commit: "T-132 automacao-whatsapp-evolution: Documentação Técnica do Subsistema de WhatsApp"

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
git merge --no-ff spec/automacao-whatsapp-evolution-faixa-1 -m "merge faixa-1 (automacao-whatsapp-evolution)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-1 && git branch -d spec/automacao-whatsapp-evolution-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa automacao-whatsapp-evolution T-127 concluida
git merge --no-ff spec/automacao-whatsapp-evolution-faixa-2 -m "merge faixa-2 (automacao-whatsapp-evolution)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-2 && git branch -d spec/automacao-whatsapp-evolution-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa automacao-whatsapp-evolution T-128 concluida
git merge --no-ff spec/automacao-whatsapp-evolution-faixa-3 -m "merge faixa-3 (automacao-whatsapp-evolution)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-3 && git branch -d spec/automacao-whatsapp-evolution-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa automacao-whatsapp-evolution T-129 concluida
git merge --no-ff spec/automacao-whatsapp-evolution-faixa-4 -m "merge faixa-4 (automacao-whatsapp-evolution)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-4 && git branch -d spec/automacao-whatsapp-evolution-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa automacao-whatsapp-evolution T-130 concluida
git merge --no-ff spec/automacao-whatsapp-evolution-faixa-5 -m "merge faixa-5 (automacao-whatsapp-evolution)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-5 && git branch -d spec/automacao-whatsapp-evolution-faixa-5
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa automacao-whatsapp-evolution T-131 concluida
git merge --no-ff spec/automacao-whatsapp-evolution-faixa-6 -m "merge faixa-6 (automacao-whatsapp-evolution)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-automacao-whatsapp-evolution-faixa-6 && git branch -d spec/automacao-whatsapp-evolution-faixa-6
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa automacao-whatsapp-evolution T-132 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify automacao-whatsapp-evolution
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-automacao-whatsapp-evolution-mvh18scv --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-automacao-whatsapp-evolution-mvh18scv --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo automacao-whatsapp-evolution --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo automacao-whatsapp-evolution --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

