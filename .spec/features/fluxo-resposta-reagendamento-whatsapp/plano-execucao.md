# Plano de execução — fluxo-resposta-reagendamento-whatsapp

> gerado por `onp-spec plano` em 2026-10-27 19:12 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano fluxo-resposta-reagendamento-whatsapp`

## Resumo — o que vai acontecer

- **4 tarefa(s) pendente(s)**: 4 em 2 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano fluxo-resposta-reagendamento-whatsapp --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/fluxo-resposta-reagendamento-whatsapp`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/fluxo-resposta-reagendamento-whatsapp-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-149 | Suporte à resolução de inbound e disparo de aviso de novo horário no Backend | `claude-sonnet-5` | medium | `shared/src/types/whatsapp.ts`, `backend/src/db/schema.sql`, `backend/src/repositories/whatsapp-repository.ts`, `backend/src/services/whatsapp-service.ts`, `backend/src/controllers/whatsapp-controller.ts`, `backend/src/routes/whatsapp.routes.ts`, `backend/src/whatsapp/__tests__/whatsapp-queue-reply.spec.ts` |

#### faixa-2 — branch `spec/fluxo-resposta-reagendamento-whatsapp-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-150 | Ocultação do botão de reagendamento após conclusão da remarcação no Frontend | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/components/WhatsappQueueView.tsx`, `frontend/src/features/whatsapp/components/__tests__/WhatsappQueueView.spec.tsx` |
| T-151 | Exibição de opções de resposta e disparo de confirmação de reagendamento no Frontend | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/services/whatsapp-queue-api.ts`, `frontend/src/features/whatsapp/hooks/useWhatsappQueue.ts`, `frontend/src/features/whatsapp/components/WhatsappQueueView.tsx`, `frontend/src/features/whatsapp/components/__tests__/WhatsappQueueView.spec.tsx` |
| T-152 | Transição visual para estado de respondido e ocultação dos botões no Frontend | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/components/WhatsappQueueView.tsx`, `frontend/src/features/whatsapp/components/__tests__/WhatsappQueueView.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/fluxo-resposta-reagendamento-whatsapp` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify fluxo-resposta-reagendamento-whatsapp` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/fluxo-resposta-reagendamento-whatsapp   # ou: git checkout spec/fluxo-resposta-reagendamento-whatsapp
git worktree add ../onp-worktrees/App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-faixa-1 -b spec/fluxo-resposta-reagendamento-whatsapp-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-faixa-2 -b spec/fluxo-resposta-reagendamento-whatsapp-faixa-2
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "fluxo-resposta-reagendamento-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-faixa-1 (branch spec/fluxo-resposta-reagendamento-whatsapp-faixa-1) — já preparado.
Leia primeiro: .spec/features/fluxo-resposta-reagendamento-whatsapp/spec.md, .spec/features/fluxo-resposta-reagendamento-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-149 — "Suporte à resolução de inbound e disparo de aviso de novo horário no Backend"
  critérios/refs: AC-225 (Exibição de opções de resposta enquanto o paciente aguarda retorno), AC-226 (Transição para estado de respondido e ocultação dos botões de resposta)
  arquivos permitidos (e seus testes): shared/src/types/whatsapp.ts, backend/src/db/schema.sql, backend/src/repositories/whatsapp-repository.ts, backend/src/services/whatsapp-service.ts, backend/src/controllers/whatsapp-controller.ts, backend/src/routes/whatsapp.routes.ts, backend/src/whatsapp/__tests__/whatsapp-queue-reply.spec.ts
  mensagem de commit: "T-149 fluxo-resposta-reagendamento-whatsapp: Suporte à resolução de inbound e disparo de aviso de novo horário no Backend"

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
Você executa as tarefas da faixa-2 da feature "fluxo-resposta-reagendamento-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-faixa-2 (branch spec/fluxo-resposta-reagendamento-whatsapp-faixa-2) — já preparado.
Leia primeiro: .spec/features/fluxo-resposta-reagendamento-whatsapp/spec.md, .spec/features/fluxo-resposta-reagendamento-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-150 — "Ocultação do botão de reagendamento após conclusão da remarcação no Frontend"
  critérios/refs: AC-224 (Ocultação do botão de reagendamento após conclusão da remarcação)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/components/__tests__/WhatsappQueueView.spec.tsx
  mensagem de commit: "T-150 fluxo-resposta-reagendamento-whatsapp: Ocultação do botão de reagendamento após conclusão da remarcação no Frontend"
T-151 — "Exibição de opções de resposta e disparo de confirmação de reagendamento no Frontend"
  critérios/refs: AC-225 (Exibição de opções de resposta enquanto o paciente aguarda retorno)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/services/whatsapp-queue-api.ts, frontend/src/features/whatsapp/hooks/useWhatsappQueue.ts, frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/components/__tests__/WhatsappQueueView.spec.tsx
  mensagem de commit: "T-151 fluxo-resposta-reagendamento-whatsapp: Exibição de opções de resposta e disparo de confirmação de reagendamento no Frontend"
T-152 — "Transição visual para estado de respondido e ocultação dos botões no Frontend"
  critérios/refs: AC-226 (Transição para estado de respondido e ocultação dos botões de resposta)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/components/__tests__/WhatsappQueueView.spec.tsx
  mensagem de commit: "T-152 fluxo-resposta-reagendamento-whatsapp: Transição visual para estado de respondido e ocultação dos botões no Frontend"

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
git merge --no-ff spec/fluxo-resposta-reagendamento-whatsapp-faixa-1 -m "merge faixa-1 (fluxo-resposta-reagendamento-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-faixa-1 && git branch -d spec/fluxo-resposta-reagendamento-whatsapp-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa fluxo-resposta-reagendamento-whatsapp T-149 concluida
git merge --no-ff spec/fluxo-resposta-reagendamento-whatsapp-faixa-2 -m "merge faixa-2 (fluxo-resposta-reagendamento-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-faixa-2 && git branch -d spec/fluxo-resposta-reagendamento-whatsapp-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa fluxo-resposta-reagendamento-whatsapp T-150 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa fluxo-resposta-reagendamento-whatsapp T-151 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa fluxo-resposta-reagendamento-whatsapp T-152 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify fluxo-resposta-reagendamento-whatsapp
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-mvr2c4ry --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-fluxo-resposta-reagendamento-whatsapp-mvr2c4ry --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo fluxo-resposta-reagendamento-whatsapp --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo fluxo-resposta-reagendamento-whatsapp --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

