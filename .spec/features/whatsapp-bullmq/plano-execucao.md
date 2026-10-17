# Plano de execução — whatsapp-bullmq

> gerado por `onp-spec plano` em 2026-10-17 20:14 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano whatsapp-bullmq`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano whatsapp-bullmq --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/whatsapp-bullmq`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/whatsapp-bullmq-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-013 | Parser Semântico de Respostas e Gerador Spintax Anti-Ban | `claude-sonnet-5` | medium | `backend/src/whatsapp/parser.ts`, `backend/src/whatsapp/spintax.ts` |

#### faixa-2 — branch `spec/whatsapp-bullmq-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-014 | Cliente Evolution API e Mock para Testes Determinísticos | `claude-sonnet-5` | medium | `backend/src/whatsapp/evolution-client.ts`, `backend/src/whatsapp/__tests__/mock-evolution.ts` |

#### faixa-3 — branch `spec/whatsapp-bullmq-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-015 | Fila BullMQ com Jitter Humanizado e Pausa Automática | `claude-sonnet-5` | medium | `backend/src/whatsapp/queue.ts`, `backend/src/whatsapp/scheduler.ts` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/whatsapp-bullmq-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-016 | Rota de Webhook da Evolution API e Atualização de Status da Agenda | `claude-sonnet-5` | medium | `backend/src/routes/webhooks.ts`, `backend/src/app.ts` |

#### faixa-5 — branch `spec/whatsapp-bullmq-faixa-5` — worktree `../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-017 | Suíte de Testes Automatizados TDD Integrada | `claude-sonnet-5` | medium | `backend/src/whatsapp/__tests__/whatsapp.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/whatsapp-bullmq` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify whatsapp-bullmq` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/whatsapp-bullmq   # ou: git checkout spec/whatsapp-bullmq
git worktree add ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-1 -b spec/whatsapp-bullmq-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-2 -b spec/whatsapp-bullmq-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-3 -b spec/whatsapp-bullmq-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-4 -b spec/whatsapp-bullmq-faixa-4
git worktree add ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-5 -b spec/whatsapp-bullmq-faixa-5
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "whatsapp-bullmq" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-1 (branch spec/whatsapp-bullmq-faixa-1) — já preparado.
Leia primeiro: .spec/features/whatsapp-bullmq/spec.md, .spec/features/whatsapp-bullmq/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-013 — "Parser Semântico de Respostas e Gerador Spintax Anti-Ban"
  critérios/refs: AC-019 (Classificação semântica de confirmação, reagendamento e dúvidas), AC-020 (Transição de status quando paciente muda de ideia), AC-021 (Variação textual dinâmica entre disparos consecutivos)
  arquivos permitidos (e seus testes): backend/src/whatsapp/parser.ts, backend/src/whatsapp/spintax.ts
  mensagem de commit: "T-013 whatsapp-bullmq: Parser Semântico de Respostas e Gerador Spintax Anti-Ban"

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
Você executa as tarefas da faixa-2 da feature "whatsapp-bullmq" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-2 (branch spec/whatsapp-bullmq-faixa-2) — já preparado.
Leia primeiro: .spec/features/whatsapp-bullmq/spec.md, .spec/features/whatsapp-bullmq/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-014 — "Cliente Evolution API e Mock para Testes Determinísticos"
  critérios/refs: AC-023 (Retry exponencial em caso de instabilidade na Evolution API)
  arquivos permitidos (e seus testes): backend/src/whatsapp/evolution-client.ts, backend/src/whatsapp/__tests__/mock-evolution.ts
  mensagem de commit: "T-014 whatsapp-bullmq: Cliente Evolution API e Mock para Testes Determinísticos"

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
Você executa as tarefas da faixa-3 da feature "whatsapp-bullmq" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-3 (branch spec/whatsapp-bullmq-faixa-3) — já preparado.
Leia primeiro: .spec/features/whatsapp-bullmq/spec.md, .spec/features/whatsapp-bullmq/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-015 — "Fila BullMQ com Jitter Humanizado e Pausa Automática"
  critérios/refs: AC-022 (Intervalo de jitter humanizado entre 20 e 50 segundos por agendamento), AC-023 (Retry exponencial em caso de instabilidade na Evolution API), AC-026 (Detecção de desconexão da sessão e pausa automática da fila)
  arquivos permitidos (e seus testes): backend/src/whatsapp/queue.ts, backend/src/whatsapp/scheduler.ts
  mensagem de commit: "T-015 whatsapp-bullmq: Fila BullMQ com Jitter Humanizado e Pausa Automática"

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
Você executa as tarefas da faixa-4 da feature "whatsapp-bullmq" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-4 (branch spec/whatsapp-bullmq-faixa-4) — já preparado.
Leia primeiro: .spec/features/whatsapp-bullmq/spec.md, .spec/features/whatsapp-bullmq/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-016 — "Rota de Webhook da Evolution API e Atualização de Status da Agenda"
  critérios/refs: AC-024 (Atualização do agendamento a partir do webhook da Evolution API), AC-025 (Tratamento silencioso e seguro para mensagens de números desconhecidos), AC-026 (Detecção de desconexão da sessão e pausa automática da fila)
  arquivos permitidos (e seus testes): backend/src/routes/webhooks.ts, backend/src/app.ts
  mensagem de commit: "T-016 whatsapp-bullmq: Rota de Webhook da Evolution API e Atualização de Status da Agenda"

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
Você executa as tarefas da faixa-5 da feature "whatsapp-bullmq" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-5 (branch spec/whatsapp-bullmq-faixa-5) — já preparado.
Leia primeiro: .spec/features/whatsapp-bullmq/spec.md, .spec/features/whatsapp-bullmq/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-017 — "Suíte de Testes Automatizados TDD Integrada"
  critérios/refs: AC-019 (Classificação semântica de confirmação, reagendamento e dúvidas), AC-020 (Transição de status quando paciente muda de ideia), AC-021 (Variação textual dinâmica entre disparos consecutivos), AC-022 (Intervalo de jitter humanizado entre 20 e 50 segundos por agendamento), AC-023 (Retry exponencial em caso de instabilidade na Evolution API), AC-024 (Atualização do agendamento a partir do webhook da Evolution API), AC-025 (Tratamento silencioso e seguro para mensagens de números desconhecidos), AC-026 (Detecção de desconexão da sessão e pausa automática da fila)
  arquivos permitidos (e seus testes): backend/src/whatsapp/__tests__/whatsapp.spec.ts
  mensagem de commit: "T-017 whatsapp-bullmq: Suíte de Testes Automatizados TDD Integrada"

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
git merge --no-ff spec/whatsapp-bullmq-faixa-1 -m "merge faixa-1 (whatsapp-bullmq)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-1 && git branch -d spec/whatsapp-bullmq-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa whatsapp-bullmq T-013 concluida
git merge --no-ff spec/whatsapp-bullmq-faixa-2 -m "merge faixa-2 (whatsapp-bullmq)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-2 && git branch -d spec/whatsapp-bullmq-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa whatsapp-bullmq T-014 concluida
git merge --no-ff spec/whatsapp-bullmq-faixa-3 -m "merge faixa-3 (whatsapp-bullmq)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-3 && git branch -d spec/whatsapp-bullmq-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa whatsapp-bullmq T-015 concluida
git merge --no-ff spec/whatsapp-bullmq-faixa-4 -m "merge faixa-4 (whatsapp-bullmq)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-4 && git branch -d spec/whatsapp-bullmq-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa whatsapp-bullmq T-016 concluida
git merge --no-ff spec/whatsapp-bullmq-faixa-5 -m "merge faixa-5 (whatsapp-bullmq)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-whatsapp-bullmq-faixa-5 && git branch -d spec/whatsapp-bullmq-faixa-5
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa whatsapp-bullmq T-017 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify whatsapp-bullmq
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-whatsapp-bullmq-mvcu4g27 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-whatsapp-bullmq-mvcu4g27 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo whatsapp-bullmq --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo whatsapp-bullmq --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

