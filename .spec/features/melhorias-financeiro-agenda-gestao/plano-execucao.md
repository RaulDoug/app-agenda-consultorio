# Plano de execução — melhorias-financeiro-agenda-gestao

> gerado por `onp-spec plano` em 2026-10-21 12:24 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano melhorias-financeiro-agenda-gestao`

## Resumo — o que vai acontecer

- **8 tarefa(s) pendente(s)**: 8 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano melhorias-financeiro-agenda-gestao --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/melhorias-financeiro-agenda-gestao`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/melhorias-financeiro-agenda-gestao-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-001 | Navegação Temporal Coerente e Interação no Grid da Agenda | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/ScheduleGrid.tsx`, `frontend/src/App.tsx` |
| T-007 | Alerta de Inadimplência, Isolamento Estrito de Dados, Persistência de Shell e Token em Relatórios | `claude-sonnet-5` | medium | `frontend/src/features/patients/components/PatientCard.tsx`, `frontend/src/features/patients/components/PatientList.tsx`, `frontend/src/features/patients/components/PatientFinancialDrawer.tsx`, `frontend/src/App.tsx`, `frontend/src/features/analytics/components/ReportsView.tsx`, `frontend/src/services/reports-api.ts` |

#### faixa-2 — branch `spec/melhorias-financeiro-agenda-gestao-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-002 | Blindagem de Sincronização Pull Contra Sobrescrita de Status Recentes | `claude-sonnet-5` | medium | `frontend/src/sync/sync-manager.ts` |

#### faixa-3 — branch `spec/melhorias-financeiro-agenda-gestao-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-003 | Parcelamento no Cartão, Vencimentos Individuais e Edição Livre de Valores no Checkout | `claude-sonnet-5` | medium | `frontend/src/features/checkout/components/CheckoutDrawer.tsx`, `frontend/src/features/checkout/components/InstallmentsForm.tsx`, `frontend/src/features/checkout/components/ItemPriceEditor.tsx` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/melhorias-financeiro-agenda-gestao-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-004 | Filtros Temporais Avançados, Busca Textual Normalizada e Exportação CSV Enriquecida | `claude-sonnet-5` | medium | `frontend/src/features/analytics/components/FinancialLedger.tsx` |
| T-005 | Modal de Detalhes, Edição, Estorno e Soft-Delete de Transações Financeiras | `claude-sonnet-5` | medium | `frontend/src/features/analytics/components/TransactionDetailModal.tsx`, `frontend/src/features/analytics/components/FinancialLedger.tsx`, `frontend/src/db/repositories/financial-local-repository.ts` |
| T-006 | Gestão Avançada de Despesas: Reset de Formulário, Status Pendente, Parcelamento e Recorrência | `claude-sonnet-5` | medium | `frontend/src/features/checkout/components/QuickExpenseModal.tsx`, `frontend/src/db/repositories/financial-local-repository.ts` |

#### faixa-5 — branch `spec/melhorias-financeiro-agenda-gestao-faixa-5` — worktree `../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-008 | Suíte de Testes Automatizados TDD Integrada e Prova Mecânica | `claude-sonnet-5` | medium | `frontend/src/features/analytics/__tests__/melhorias-financeiro-agenda-gestao.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/melhorias-financeiro-agenda-gestao` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify melhorias-financeiro-agenda-gestao` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/melhorias-financeiro-agenda-gestao   # ou: git checkout spec/melhorias-financeiro-agenda-gestao
git worktree add ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-1 -b spec/melhorias-financeiro-agenda-gestao-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-2 -b spec/melhorias-financeiro-agenda-gestao-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-3 -b spec/melhorias-financeiro-agenda-gestao-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-4 -b spec/melhorias-financeiro-agenda-gestao-faixa-4
git worktree add ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-5 -b spec/melhorias-financeiro-agenda-gestao-faixa-5
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "melhorias-financeiro-agenda-gestao" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-1 (branch spec/melhorias-financeiro-agenda-gestao-faixa-1) — já preparado.
Leia primeiro: .spec/features/melhorias-financeiro-agenda-gestao/spec.md, .spec/features/melhorias-financeiro-agenda-gestao/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-001 — "Navegação Temporal Coerente e Interação no Grid da Agenda"
  critérios/refs: AC-183 (Transição de visualização semanal/mensal para diária e navegação temporal dinâmica)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/ScheduleGrid.tsx, frontend/src/App.tsx
  mensagem de commit: "T-001 melhorias-financeiro-agenda-gestao: Navegação Temporal Coerente e Interação no Grid da Agenda"
T-007 — "Alerta de Inadimplência, Isolamento Estrito de Dados, Persistência de Shell e Token em Relatórios"
  critérios/refs: AC-191 (Indicador visual de débitos no card do paciente e isolamento financeiro estrito por ID), AC-192 (Baixa individual com seleção de método e valor, persistência de abas/filtros e autenticação de relatórios)
  arquivos permitidos (e seus testes): frontend/src/features/patients/components/PatientCard.tsx, frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/PatientFinancialDrawer.tsx, frontend/src/App.tsx, frontend/src/features/analytics/components/ReportsView.tsx, frontend/src/services/reports-api.ts
  mensagem de commit: "T-007 melhorias-financeiro-agenda-gestao: Alerta de Inadimplência, Isolamento Estrito de Dados, Persistência de Shell e Token em Relatórios"

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
Você executa as tarefas da faixa-2 da feature "melhorias-financeiro-agenda-gestao" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-2 (branch spec/melhorias-financeiro-agenda-gestao-faixa-2) — já preparado.
Leia primeiro: .spec/features/melhorias-financeiro-agenda-gestao/spec.md, .spec/features/melhorias-financeiro-agenda-gestao/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-002 — "Blindagem de Sincronização Pull Contra Sobrescrita de Status Recentes"
  critérios/refs: AC-184 (Resiliência de status local contra sobrescrita por sincronização pull desatualizada)
  arquivos permitidos (e seus testes): frontend/src/sync/sync-manager.ts
  mensagem de commit: "T-002 melhorias-financeiro-agenda-gestao: Blindagem de Sincronização Pull Contra Sobrescrita de Status Recentes"

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
Você executa as tarefas da faixa-3 da feature "melhorias-financeiro-agenda-gestao" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-3 (branch spec/melhorias-financeiro-agenda-gestao-faixa-3) — já preparado.
Leia primeiro: .spec/features/melhorias-financeiro-agenda-gestao/spec.md, .spec/features/melhorias-financeiro-agenda-gestao/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-003 — "Parcelamento no Cartão, Vencimentos Individuais e Edição Livre de Valores no Checkout"
  critérios/refs: AC-185 (Parcelamento em Cartão de Crédito e customização individual de vencimentos por parcela), AC-186 (Ajuste manual e irrestrito de valores e procedimentos no checkout)
  arquivos permitidos (e seus testes): frontend/src/features/checkout/components/CheckoutDrawer.tsx, frontend/src/features/checkout/components/InstallmentsForm.tsx, frontend/src/features/checkout/components/ItemPriceEditor.tsx
  mensagem de commit: "T-003 melhorias-financeiro-agenda-gestao: Parcelamento no Cartão, Vencimentos Individuais e Edição Livre de Valores no Checkout"

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
Você executa as tarefas da faixa-4 da feature "melhorias-financeiro-agenda-gestao" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-4 (branch spec/melhorias-financeiro-agenda-gestao-faixa-4) — já preparado.
Leia primeiro: .spec/features/melhorias-financeiro-agenda-gestao/spec.md, .spec/features/melhorias-financeiro-agenda-gestao/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-004 — "Filtros Temporais Avançados, Busca Textual Normalizada e Exportação CSV Enriquecida"
  critérios/refs: AC-187 (Filtros temporais avançados e busca textual normalizada no Extrato), AC-188 (Exportação CSV do Livro Caixa com identificação de cliente e telefone em receitas)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/components/FinancialLedger.tsx
  mensagem de commit: "T-004 melhorias-financeiro-agenda-gestao: Filtros Temporais Avançados, Busca Textual Normalizada e Exportação CSV Enriquecida"
T-005 — "Modal de Detalhes, Edição, Estorno e Soft-Delete de Transações Financeiras"
  critérios/refs: AC-189 (Detalhes, edição, estorno de pagamentos e soft-delete de transações no Extrato)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/components/TransactionDetailModal.tsx, frontend/src/features/analytics/components/FinancialLedger.tsx, frontend/src/db/repositories/financial-local-repository.ts
  mensagem de commit: "T-005 melhorias-financeiro-agenda-gestao: Modal de Detalhes, Edição, Estorno e Soft-Delete de Transações Financeiras"
T-006 — "Gestão Avançada de Despesas: Reset de Formulário, Status Pendente, Parcelamento e Recorrência"
  critérios/refs: AC-190 (Despesas rápidas com reset de formulário, suporte a pendências, parcelamento e recorrência)
  arquivos permitidos (e seus testes): frontend/src/features/checkout/components/QuickExpenseModal.tsx, frontend/src/db/repositories/financial-local-repository.ts
  mensagem de commit: "T-006 melhorias-financeiro-agenda-gestao: Gestão Avançada de Despesas: Reset de Formulário, Status Pendente, Parcelamento e Recorrência"

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
Você executa as tarefas da faixa-5 da feature "melhorias-financeiro-agenda-gestao" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-5 (branch spec/melhorias-financeiro-agenda-gestao-faixa-5) — já preparado.
Leia primeiro: .spec/features/melhorias-financeiro-agenda-gestao/spec.md, .spec/features/melhorias-financeiro-agenda-gestao/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-008 — "Suíte de Testes Automatizados TDD Integrada e Prova Mecânica"
  critérios/refs: AC-183 (Transição de visualização semanal/mensal para diária e navegação temporal dinâmica), AC-184 (Resiliência de status local contra sobrescrita por sincronização pull desatualizada), AC-185 (Parcelamento em Cartão de Crédito e customização individual de vencimentos por parcela), AC-186 (Ajuste manual e irrestrito de valores e procedimentos no checkout), AC-187 (Filtros temporais avançados e busca textual normalizada no Extrato), AC-188 (Exportação CSV do Livro Caixa com identificação de cliente e telefone em receitas), AC-189 (Detalhes, edição, estorno de pagamentos e soft-delete de transações no Extrato), AC-190 (Despesas rápidas com reset de formulário, suporte a pendências, parcelamento e recorrência), AC-191 (Indicador visual de débitos no card do paciente e isolamento financeiro estrito por ID), AC-192 (Baixa individual com seleção de método e valor, persistência de abas/filtros e autenticação de relatórios)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/__tests__/melhorias-financeiro-agenda-gestao.spec.tsx
  mensagem de commit: "T-008 melhorias-financeiro-agenda-gestao: Suíte de Testes Automatizados TDD Integrada e Prova Mecânica"

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
git merge --no-ff spec/melhorias-financeiro-agenda-gestao-faixa-1 -m "merge faixa-1 (melhorias-financeiro-agenda-gestao)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-1 && git branch -d spec/melhorias-financeiro-agenda-gestao-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-financeiro-agenda-gestao T-001 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-financeiro-agenda-gestao T-007 concluida
git merge --no-ff spec/melhorias-financeiro-agenda-gestao-faixa-2 -m "merge faixa-2 (melhorias-financeiro-agenda-gestao)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-2 && git branch -d spec/melhorias-financeiro-agenda-gestao-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-financeiro-agenda-gestao T-002 concluida
git merge --no-ff spec/melhorias-financeiro-agenda-gestao-faixa-3 -m "merge faixa-3 (melhorias-financeiro-agenda-gestao)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-3 && git branch -d spec/melhorias-financeiro-agenda-gestao-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-financeiro-agenda-gestao T-003 concluida
git merge --no-ff spec/melhorias-financeiro-agenda-gestao-faixa-4 -m "merge faixa-4 (melhorias-financeiro-agenda-gestao)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-4 && git branch -d spec/melhorias-financeiro-agenda-gestao-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-financeiro-agenda-gestao T-004 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-financeiro-agenda-gestao T-005 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-financeiro-agenda-gestao T-006 concluida
git merge --no-ff spec/melhorias-financeiro-agenda-gestao-faixa-5 -m "merge faixa-5 (melhorias-financeiro-agenda-gestao)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-faixa-5 && git branch -d spec/melhorias-financeiro-agenda-gestao-faixa-5
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-financeiro-agenda-gestao T-008 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify melhorias-financeiro-agenda-gestao
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-mvi34e0e --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-melhorias-financeiro-agenda-gestao-mvi34e0e --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo melhorias-financeiro-agenda-gestao --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo melhorias-financeiro-agenda-gestao --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

