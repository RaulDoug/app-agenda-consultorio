# Plano de execução — financeiro-frontend-relatorios

> gerado por `onp-spec plano` em 2026-10-21 10:58 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano financeiro-frontend-relatorios --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 6 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/financeiro-frontend-relatorios`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-001 | Extrato Financeiro Detalhado Mobile-First e Filtros Avançados (Ledger) | `claude-sonnet-5` | medium |
| T-002 | Baixa em Lote com Ergonomia One-Thumb e Bottom Sheet de Confirmação | `claude-sonnet-5` | medium |
| T-003 | Gestão Dinâmica e Seleção de Categorias Financeiras | `claude-sonnet-5` | medium |
| T-004 | Conector Híbrido de Relatórios e Revalidação Server-Side | `claude-sonnet-5` | medium |
| T-005 | Prontuário Financeiro no Detalhe do Paciente via Bottom Drawer | `claude-sonnet-5` | medium |
| T-006 | Suíte de Testes Automatizados TDD e Prova Mecânica | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/financeiro-frontend-relatorios` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify financeiro-frontend-relatorios` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/financeiro-frontend-relatorios   # ou: git checkout spec/financeiro-frontend-relatorios
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-001

```
Você executa UMA tarefa da feature "financeiro-frontend-relatorios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/financeiro-frontend-relatorios/spec.md, .spec/features/financeiro-frontend-relatorios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-001 — "Extrato Financeiro Detalhado Mobile-First e Filtros Avançados (Ledger)"
  critérios/refs: AC-178 (Extrato de transações em lista vertical responsiva com filtragem e exportação)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/components/FinancialLedger.tsx, frontend/src/features/analytics/components/CashFlowDashboard.tsx
  mensagem de commit: "T-001 financeiro-frontend-relatorios: Extrato Financeiro Detalhado Mobile-First e Filtros Avançados (Ledger)"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa financeiro-frontend-relatorios T-001 concluida` após o commit.

#### Prompt — T-002

```
Você executa UMA tarefa da feature "financeiro-frontend-relatorios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/financeiro-frontend-relatorios/spec.md, .spec/features/financeiro-frontend-relatorios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-002 — "Baixa em Lote com Ergonomia One-Thumb e Bottom Sheet de Confirmação"
  critérios/refs: AC-179 (Seleção múltipla com barra de ação inferior e baixa em lote via Bottom Sheet)
  arquivos permitidos (e seus testes): frontend/src/db/repositories/financial-local-repository.ts, frontend/src/features/analytics/components/ReceivablesList.tsx, frontend/src/features/analytics/components/BatchSettleModal.tsx
  mensagem de commit: "T-002 financeiro-frontend-relatorios: Baixa em Lote com Ergonomia One-Thumb e Bottom Sheet de Confirmação"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa financeiro-frontend-relatorios T-002 concluida` após o commit.

#### Prompt — T-003

```
Você executa UMA tarefa da feature "financeiro-frontend-relatorios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/financeiro-frontend-relatorios/spec.md, .spec/features/financeiro-frontend-relatorios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-003 — "Gestão Dinâmica e Seleção de Categorias Financeiras"
  critérios/refs: AC-180 (Seleção dinâmica de categorias de despesa com fallback offline)
  arquivos permitidos (e seus testes): frontend/src/features/checkout/components/QuickExpenseModal.tsx, frontend/src/db/repositories/financial-local-repository.ts
  mensagem de commit: "T-003 financeiro-frontend-relatorios: Gestão Dinâmica e Seleção de Categorias Financeiras"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa financeiro-frontend-relatorios T-003 concluida` após o commit.

#### Prompt — T-004

```
Você executa UMA tarefa da feature "financeiro-frontend-relatorios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/financeiro-frontend-relatorios/spec.md, .spec/features/financeiro-frontend-relatorios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-004 — "Conector Híbrido de Relatórios e Revalidação Server-Side"
  critérios/refs: AC-181 (Visualização instantânea de métricas em cards verticais com revalidação do servidor)
  arquivos permitidos (e seus testes): frontend/src/services/reports-api.ts, frontend/src/features/analytics/components/ReportsView.tsx
  mensagem de commit: "T-004 financeiro-frontend-relatorios: Conector Híbrido de Relatórios e Revalidação Server-Side"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa financeiro-frontend-relatorios T-004 concluida` após o commit.

#### Prompt — T-005

```
Você executa UMA tarefa da feature "financeiro-frontend-relatorios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/financeiro-frontend-relatorios/spec.md, .spec/features/financeiro-frontend-relatorios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-005 — "Prontuário Financeiro no Detalhe do Paciente via Bottom Drawer"
  critérios/refs: AC-182 (Visualização de prontuário financeiro via Bottom Drawer com quitação pontual)
  arquivos permitidos (e seus testes): frontend/src/features/patients/components/PatientFinancialDrawer.tsx, frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/PatientCard.tsx
  mensagem de commit: "T-005 financeiro-frontend-relatorios: Prontuário Financeiro no Detalhe do Paciente via Bottom Drawer"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa financeiro-frontend-relatorios T-005 concluida` após o commit.

#### Prompt — T-006

```
Você executa UMA tarefa da feature "financeiro-frontend-relatorios" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/financeiro-frontend-relatorios/spec.md, .spec/features/financeiro-frontend-relatorios/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-006 — "Suíte de Testes Automatizados TDD e Prova Mecânica"
  critérios/refs: AC-178 (Extrato de transações em lista vertical responsiva com filtragem e exportação), AC-179 (Seleção múltipla com barra de ação inferior e baixa em lote via Bottom Sheet), AC-180 (Seleção dinâmica de categorias de despesa com fallback offline), AC-181 (Visualização instantânea de métricas em cards verticais com revalidação do servidor), AC-182 (Visualização de prontuário financeiro via Bottom Drawer com quitação pontual)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/__tests__/financeiro-relatorios.spec.tsx
  mensagem de commit: "T-006 financeiro-frontend-relatorios: Suíte de Testes Automatizados TDD e Prova Mecânica"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa financeiro-frontend-relatorios T-006 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify financeiro-frontend-relatorios
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-financeiro-frontend-relatorios-mvi017t1 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-financeiro-frontend-relatorios-mvi017t1 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo financeiro-frontend-relatorios --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo financeiro-frontend-relatorios --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

