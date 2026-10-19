# Plano de execução — bloqueio-recorrencia-parcelamento-checkout

> gerado por `onp-spec plano` em 2026-10-19 19:07 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano bloqueio-recorrencia-parcelamento-checkout`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano bloqueio-recorrencia-parcelamento-checkout --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/bloqueio-recorrencia-parcelamento-checkout`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/bloqueio-recorrencia-parcelamento-checkout-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-085 | Repositório Financeiro: Salvaguarda Idempotente e Método de Estorno (`revertCheckout`) | `claude-sonnet-5` | medium | `frontend/src/db/repositories/financial-local-repository.ts` |

#### faixa-2 — branch `spec/bloqueio-recorrencia-parcelamento-checkout-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-086 | Frontend: Bloqueio de Ações Rápidas, Banner Informativo e Botão com Confirmação de Estorno | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx` |

#### faixa-3 — branch `spec/bloqueio-recorrencia-parcelamento-checkout-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-087 | Frontend: Integração Nativa de `InstallmentsForm` e Validação no `CheckoutDrawer` | `claude-sonnet-5` | medium | `frontend/src/features/checkout/components/CheckoutDrawer.tsx` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/bloqueio-recorrencia-parcelamento-checkout-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-088 | Frontend: Conexão do Repositório Financeiro e Suporte a Parcelas no `App.tsx` | `claude-sonnet-5` | medium | `frontend/src/App.tsx` |

#### faixa-5 — branch `spec/bloqueio-recorrencia-parcelamento-checkout-faixa-5` — worktree `../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-089 | Testes Automatizados TDD com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/agenda/__tests__/bloqueio-status-parcelamento.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/bloqueio-recorrencia-parcelamento-checkout` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify bloqueio-recorrencia-parcelamento-checkout` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/bloqueio-recorrencia-parcelamento-checkout   # ou: git checkout spec/bloqueio-recorrencia-parcelamento-checkout
git worktree add ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-1 -b spec/bloqueio-recorrencia-parcelamento-checkout-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-2 -b spec/bloqueio-recorrencia-parcelamento-checkout-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-3 -b spec/bloqueio-recorrencia-parcelamento-checkout-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-4 -b spec/bloqueio-recorrencia-parcelamento-checkout-faixa-4
git worktree add ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-5 -b spec/bloqueio-recorrencia-parcelamento-checkout-faixa-5
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "bloqueio-recorrencia-parcelamento-checkout" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-1 (branch spec/bloqueio-recorrencia-parcelamento-checkout-faixa-1) — já preparado.
Leia primeiro: .spec/features/bloqueio-recorrencia-parcelamento-checkout/spec.md, .spec/features/bloqueio-recorrencia-parcelamento-checkout/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-085 — "Repositório Financeiro: Salvaguarda Idempotente e Método de Estorno (`revertCheckout`)"
  critérios/refs: AC-101 (Proteção idempotente no repositório financeiro contra checkout duplicado), AC-103 (Estorno financeiro com desativação de transações e reabertura do agendamento para CONFIRMED)
  arquivos permitidos (e seus testes): frontend/src/db/repositories/financial-local-repository.ts
  mensagem de commit: "T-085 bloqueio-recorrencia-parcelamento-checkout: Repositório Financeiro: Salvaguarda Idempotente e Método de Estorno (`revertCheckout`)"

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
Você executa as tarefas da faixa-2 da feature "bloqueio-recorrencia-parcelamento-checkout" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-2 (branch spec/bloqueio-recorrencia-parcelamento-checkout-faixa-2) — já preparado.
Leia primeiro: .spec/features/bloqueio-recorrencia-parcelamento-checkout/spec.md, .spec/features/bloqueio-recorrencia-parcelamento-checkout/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-086 — "Frontend: Bloqueio de Ações Rápidas, Banner Informativo e Botão com Confirmação de Estorno"
  critérios/refs: AC-100 (Bloqueio visual de ações rápidas de status e edição em consultas concluídas), AC-103 (Estorno financeiro com desativação de transações e reabertura do agendamento para CONFIRMED)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx
  mensagem de commit: "T-086 bloqueio-recorrencia-parcelamento-checkout: Frontend: Bloqueio de Ações Rápidas, Banner Informativo e Botão com Confirmação de Estorno"

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
Você executa as tarefas da faixa-3 da feature "bloqueio-recorrencia-parcelamento-checkout" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-3 (branch spec/bloqueio-recorrencia-parcelamento-checkout-faixa-3) — já preparado.
Leia primeiro: .spec/features/bloqueio-recorrencia-parcelamento-checkout/spec.md, .spec/features/bloqueio-recorrencia-parcelamento-checkout/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-087 — "Frontend: Integração Nativa de `InstallmentsForm` e Validação no `CheckoutDrawer`"
  critérios/refs: AC-102 (Integração nativa do formulário de parcelamento com entrada e vencimentos no checkout)
  arquivos permitidos (e seus testes): frontend/src/features/checkout/components/CheckoutDrawer.tsx
  mensagem de commit: "T-087 bloqueio-recorrencia-parcelamento-checkout: Frontend: Integração Nativa de `InstallmentsForm` e Validação no `CheckoutDrawer`"

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
Você executa as tarefas da faixa-4 da feature "bloqueio-recorrencia-parcelamento-checkout" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-4 (branch spec/bloqueio-recorrencia-parcelamento-checkout-faixa-4) — já preparado.
Leia primeiro: .spec/features/bloqueio-recorrencia-parcelamento-checkout/spec.md, .spec/features/bloqueio-recorrencia-parcelamento-checkout/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-088 — "Frontend: Conexão do Repositório Financeiro e Suporte a Parcelas no `App.tsx`"
  critérios/refs: AC-102 (Integração nativa do formulário de parcelamento com entrada e vencimentos no checkout), AC-103 (Estorno financeiro com desativação de transações e reabertura do agendamento para CONFIRMED)
  arquivos permitidos (e seus testes): frontend/src/App.tsx
  mensagem de commit: "T-088 bloqueio-recorrencia-parcelamento-checkout: Frontend: Conexão do Repositório Financeiro e Suporte a Parcelas no `App.tsx`"

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
Você executa as tarefas da faixa-5 da feature "bloqueio-recorrencia-parcelamento-checkout" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-5 (branch spec/bloqueio-recorrencia-parcelamento-checkout-faixa-5) — já preparado.
Leia primeiro: .spec/features/bloqueio-recorrencia-parcelamento-checkout/spec.md, .spec/features/bloqueio-recorrencia-parcelamento-checkout/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-089 — "Testes Automatizados TDD com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-100 (Bloqueio visual de ações rápidas de status e edição em consultas concluídas), AC-101 (Proteção idempotente no repositório financeiro contra checkout duplicado), AC-102 (Integração nativa do formulário de parcelamento com entrada e vencimentos no checkout), AC-103 (Estorno financeiro com desativação de transações e reabertura do agendamento para CONFIRMED)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/__tests__/bloqueio-status-parcelamento.spec.tsx
  mensagem de commit: "T-089 bloqueio-recorrencia-parcelamento-checkout: Testes Automatizados TDD com Prova Mecânica e Auditoria CI"

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
git merge --no-ff spec/bloqueio-recorrencia-parcelamento-checkout-faixa-1 -m "merge faixa-1 (bloqueio-recorrencia-parcelamento-checkout)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-1 && git branch -d spec/bloqueio-recorrencia-parcelamento-checkout-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa bloqueio-recorrencia-parcelamento-checkout T-085 concluida
git merge --no-ff spec/bloqueio-recorrencia-parcelamento-checkout-faixa-2 -m "merge faixa-2 (bloqueio-recorrencia-parcelamento-checkout)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-2 && git branch -d spec/bloqueio-recorrencia-parcelamento-checkout-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa bloqueio-recorrencia-parcelamento-checkout T-086 concluida
git merge --no-ff spec/bloqueio-recorrencia-parcelamento-checkout-faixa-3 -m "merge faixa-3 (bloqueio-recorrencia-parcelamento-checkout)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-3 && git branch -d spec/bloqueio-recorrencia-parcelamento-checkout-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa bloqueio-recorrencia-parcelamento-checkout T-087 concluida
git merge --no-ff spec/bloqueio-recorrencia-parcelamento-checkout-faixa-4 -m "merge faixa-4 (bloqueio-recorrencia-parcelamento-checkout)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-4 && git branch -d spec/bloqueio-recorrencia-parcelamento-checkout-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa bloqueio-recorrencia-parcelamento-checkout T-088 concluida
git merge --no-ff spec/bloqueio-recorrencia-parcelamento-checkout-faixa-5 -m "merge faixa-5 (bloqueio-recorrencia-parcelamento-checkout)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-faixa-5 && git branch -d spec/bloqueio-recorrencia-parcelamento-checkout-faixa-5
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa bloqueio-recorrencia-parcelamento-checkout T-089 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify bloqueio-recorrencia-parcelamento-checkout
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-mvfmmigi --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-bloqueio-recorrencia-parcelamento-checkout-mvfmmigi --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo bloqueio-recorrencia-parcelamento-checkout --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo bloqueio-recorrencia-parcelamento-checkout --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

