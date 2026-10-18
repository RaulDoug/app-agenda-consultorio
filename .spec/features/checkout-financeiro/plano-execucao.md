# Plano de execução — checkout-financeiro

> gerado por `onp-spec plano` em 2026-10-18 15:47 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano checkout-financeiro --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 5 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/checkout-financeiro`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-045 | Componente de Checkout com Edição de Itens e Rateio Proporcional de Desconto | `claude-sonnet-5` | medium |
| T-046 | Parcelamento Flexível com Entrada e Geração Automática de Parcelas | `claude-sonnet-5` | medium |
| T-047 | Gaveta de Retorno Inteligente (15d, 30d, 6m) e Sugestão de Horários Livres | `claude-sonnet-5` | medium |
| T-048 | Modal de Lançamento Rápido de Despesa (<10s) com Categorias | `claude-sonnet-5` | medium |
| T-049 | Suíte de Testes Automatizados TDD do Checkout Financeiro e Retorno | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/checkout-financeiro` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify checkout-financeiro` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/checkout-financeiro   # ou: git checkout spec/checkout-financeiro
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-045

```
Você executa UMA tarefa da feature "checkout-financeiro" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/checkout-financeiro/spec.md, .spec/features/checkout-financeiro/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-045 — "Componente de Checkout com Edição de Itens e Rateio Proporcional de Desconto"
  critérios/refs: AC-065 (Edição Individual de Procedimentos e Rateio Automático de Desconto Geral (R$ e %)), AC-066 (Validação Visual de Entrada e Formatação Monetária Fluida)
  arquivos permitidos (e seus testes): frontend/src/features/checkout/components/CheckoutDrawer.tsx, frontend/src/features/checkout/components/ItemPriceEditor.tsx, frontend/src/features/checkout/utils/discount-splitter.ts
  mensagem de commit: "T-045 checkout-financeiro: Componente de Checkout com Edição de Itens e Rateio Proporcional de Desconto"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa checkout-financeiro T-045 concluida` após o commit.

#### Prompt — T-046

```
Você executa UMA tarefa da feature "checkout-financeiro" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/checkout-financeiro/spec.md, .spec/features/checkout-financeiro/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-046 — "Parcelamento Flexível com Entrada e Geração Automática de Parcelas"
  critérios/refs: AC-066 (Validação Visual de Entrada e Formatação Monetária Fluida), AC-067 (Configuração de Parcelamento com Entrada e Calendário de Vencimentos)
  arquivos permitidos (e seus testes): frontend/src/features/checkout/components/InstallmentsForm.tsx, frontend/src/db/repositories/financial-local-repository.ts
  mensagem de commit: "T-046 checkout-financeiro: Parcelamento Flexível com Entrada e Geração Automática de Parcelas"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa checkout-financeiro T-046 concluida` após o commit.

#### Prompt — T-047

```
Você executa UMA tarefa da feature "checkout-financeiro" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/checkout-financeiro/spec.md, .spec/features/checkout-financeiro/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-047 — "Gaveta de Retorno Inteligente (15d, 30d, 6m) e Sugestão de Horários Livres"
  critérios/refs: AC-068 (Sugestão de Retorno Rápido (15 dias, 30 dias, 6 meses) com Resolução de Conflitos)
  arquivos permitidos (e seus testes): frontend/src/features/checkout/components/SmartReturnDrawer.tsx, frontend/src/features/checkout/utils/smart-return.ts
  mensagem de commit: "T-047 checkout-financeiro: Gaveta de Retorno Inteligente (15d, 30d, 6m) e Sugestão de Horários Livres"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa checkout-financeiro T-047 concluida` após o commit.

#### Prompt — T-048

```
Você executa UMA tarefa da feature "checkout-financeiro" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/checkout-financeiro/spec.md, .spec/features/checkout-financeiro/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-048 — "Modal de Lançamento Rápido de Despesa (<10s) com Categorias"
  critérios/refs: AC-069 (Modal de Lançamento Rápido de Despesa (< 10 segundos))
  arquivos permitidos (e seus testes): frontend/src/features/checkout/components/QuickExpenseModal.tsx
  mensagem de commit: "T-048 checkout-financeiro: Modal de Lançamento Rápido de Despesa (<10s) com Categorias"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa checkout-financeiro T-048 concluida` após o commit.

#### Prompt — T-049

```
Você executa UMA tarefa da feature "checkout-financeiro" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/checkout-financeiro/spec.md, .spec/features/checkout-financeiro/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-049 — "Suíte de Testes Automatizados TDD do Checkout Financeiro e Retorno"
  critérios/refs: AC-065 (Edição Individual de Procedimentos e Rateio Automático de Desconto Geral (R$ e %)), AC-066 (Validação Visual de Entrada e Formatação Monetária Fluida), AC-067 (Configuração de Parcelamento com Entrada e Calendário de Vencimentos), AC-068 (Sugestão de Retorno Rápido (15 dias, 30 dias, 6 meses) com Resolução de Conflitos), AC-069 (Modal de Lançamento Rápido de Despesa (< 10 segundos))
  arquivos permitidos (e seus testes): frontend/src/features/checkout/__tests__/checkout-ui.spec.tsx
  mensagem de commit: "T-049 checkout-financeiro: Suíte de Testes Automatizados TDD do Checkout Financeiro e Retorno"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa checkout-financeiro T-049 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify checkout-financeiro
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-checkout-financeiro-mve00td4 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-checkout-financeiro-mve00td4 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo checkout-financeiro --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo checkout-financeiro --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

