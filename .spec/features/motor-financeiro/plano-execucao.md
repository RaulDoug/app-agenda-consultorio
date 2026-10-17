# Plano de execução — motor-financeiro

> gerado por `onp-spec plano` em 2026-10-17 21:25 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano motor-financeiro`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano motor-financeiro --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/motor-financeiro`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/motor-financeiro-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-018 | Algoritmo Puro de Cálculo Financeiro: Rateio de Desconto e O Teste do Centavo | `claude-sonnet-5` | medium | `backend/src/financial/calculator.ts` |

#### faixa-2 — branch `spec/motor-financeiro-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-019 | Gerador de Parcelas com Regra de Virada de Mês e Validação de Entrada | `claude-sonnet-5` | medium | `backend/src/financial/installments.ts` |

#### faixa-3 — branch `spec/motor-financeiro-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-020 | Repositório Financeiro e Transações Contábeis no PostgreSQL | `claude-sonnet-5` | medium | `backend/src/repositories/financial-repository.ts` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/motor-financeiro-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-021 | Rotas REST de Conclusão Financeira, Quitação em Lote e Despesas Rápidas | `claude-sonnet-5` | medium | `backend/src/routes/financial.ts`, `backend/src/app.ts` |

#### faixa-5 — branch `spec/motor-financeiro-faixa-5` — worktree `../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-022 | Suíte Integrada de Testes Automatizados TDD do Motor Financeiro | `claude-sonnet-5` | medium | `backend/src/financial/__tests__/financial.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/motor-financeiro` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify motor-financeiro` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/motor-financeiro   # ou: git checkout spec/motor-financeiro
git worktree add ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-1 -b spec/motor-financeiro-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-2 -b spec/motor-financeiro-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-3 -b spec/motor-financeiro-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-4 -b spec/motor-financeiro-faixa-4
git worktree add ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-5 -b spec/motor-financeiro-faixa-5
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "motor-financeiro" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-1 (branch spec/motor-financeiro-faixa-1) — já preparado.
Leia primeiro: .spec/features/motor-financeiro/spec.md, .spec/features/motor-financeiro/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-018 — "Algoritmo Puro de Cálculo Financeiro: Rateio de Desconto e O Teste do Centavo"
  critérios/refs: AC-027 (Rateio proporcional de desconto global e edição individual de itens), AC-028 (Resolução da dízima periódica (O Teste do Centavo) sem perdas ou sobras)
  arquivos permitidos (e seus testes): backend/src/financial/calculator.ts
  mensagem de commit: "T-018 motor-financeiro: Algoritmo Puro de Cálculo Financeiro: Rateio de Desconto e O Teste do Centavo"

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
Você executa as tarefas da faixa-2 da feature "motor-financeiro" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-2 (branch spec/motor-financeiro-faixa-2) — já preparado.
Leia primeiro: .spec/features/motor-financeiro/spec.md, .spec/features/motor-financeiro/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-019 — "Gerador de Parcelas com Regra de Virada de Mês e Validação de Entrada"
  critérios/refs: AC-029 (Geração de parcelas com entrada diferenciada e status contábil), AC-030 (Projeção mensal de parcelas com ajuste automático para virada de mês (dias 29, 30 e 31)), AC-031 (Rejeição de entrada maior ou igual ao valor total em cobrança parcelada)
  arquivos permitidos (e seus testes): backend/src/financial/installments.ts
  mensagem de commit: "T-019 motor-financeiro: Gerador de Parcelas com Regra de Virada de Mês e Validação de Entrada"

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
Você executa as tarefas da faixa-3 da feature "motor-financeiro" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-3 (branch spec/motor-financeiro-faixa-3) — já preparado.
Leia primeiro: .spec/features/motor-financeiro/spec.md, .spec/features/motor-financeiro/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-020 — "Repositório Financeiro e Transações Contábeis no PostgreSQL"
  critérios/refs: AC-027 (Rateio proporcional de desconto global e edição individual de itens), AC-029 (Geração de parcelas com entrada diferenciada e status contábil), AC-034 (Soft Delete e integridade contábil em cancelamento de transações)
  arquivos permitidos (e seus testes): backend/src/repositories/financial-repository.ts
  mensagem de commit: "T-020 motor-financeiro: Repositório Financeiro e Transações Contábeis no PostgreSQL"

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
Você executa as tarefas da faixa-4 da feature "motor-financeiro" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-4 (branch spec/motor-financeiro-faixa-4) — já preparado.
Leia primeiro: .spec/features/motor-financeiro/spec.md, .spec/features/motor-financeiro/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-021 — "Rotas REST de Conclusão Financeira, Quitação em Lote e Despesas Rápidas"
  critérios/refs: AC-027 (Rateio proporcional de desconto global e edição individual de itens), AC-029 (Geração de parcelas com entrada diferenciada e status contábil), AC-031 (Rejeição de entrada maior ou igual ao valor total em cobrança parcelada), AC-032 (Quitação antecipada e em lote de múltiplas parcelas pendentes), AC-033 (Registro e categorização de despesas rápidas de consultório)
  arquivos permitidos (e seus testes): backend/src/routes/financial.ts, backend/src/app.ts
  mensagem de commit: "T-021 motor-financeiro: Rotas REST de Conclusão Financeira, Quitação em Lote e Despesas Rápidas"

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
Você executa as tarefas da faixa-5 da feature "motor-financeiro" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-5 (branch spec/motor-financeiro-faixa-5) — já preparado.
Leia primeiro: .spec/features/motor-financeiro/spec.md, .spec/features/motor-financeiro/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-022 — "Suíte Integrada de Testes Automatizados TDD do Motor Financeiro"
  critérios/refs: AC-027 (Rateio proporcional de desconto global e edição individual de itens), AC-028 (Resolução da dízima periódica (O Teste do Centavo) sem perdas ou sobras), AC-029 (Geração de parcelas com entrada diferenciada e status contábil), AC-030 (Projeção mensal de parcelas com ajuste automático para virada de mês (dias 29, 30 e 31)), AC-031 (Rejeição de entrada maior ou igual ao valor total em cobrança parcelada), AC-032 (Quitação antecipada e em lote de múltiplas parcelas pendentes), AC-033 (Registro e categorização de despesas rápidas de consultório), AC-034 (Soft Delete e integridade contábil em cancelamento de transações)
  arquivos permitidos (e seus testes): backend/src/financial/__tests__/financial.spec.ts
  mensagem de commit: "T-022 motor-financeiro: Suíte Integrada de Testes Automatizados TDD do Motor Financeiro"

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
git merge --no-ff spec/motor-financeiro-faixa-1 -m "merge faixa-1 (motor-financeiro)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-1 && git branch -d spec/motor-financeiro-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa motor-financeiro T-018 concluida
git merge --no-ff spec/motor-financeiro-faixa-2 -m "merge faixa-2 (motor-financeiro)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-2 && git branch -d spec/motor-financeiro-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa motor-financeiro T-019 concluida
git merge --no-ff spec/motor-financeiro-faixa-3 -m "merge faixa-3 (motor-financeiro)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-3 && git branch -d spec/motor-financeiro-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa motor-financeiro T-020 concluida
git merge --no-ff spec/motor-financeiro-faixa-4 -m "merge faixa-4 (motor-financeiro)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-4 && git branch -d spec/motor-financeiro-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa motor-financeiro T-021 concluida
git merge --no-ff spec/motor-financeiro-faixa-5 -m "merge faixa-5 (motor-financeiro)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-motor-financeiro-faixa-5 && git branch -d spec/motor-financeiro-faixa-5
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa motor-financeiro T-022 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify motor-financeiro
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-motor-financeiro-mvcwnpin --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-motor-financeiro-mvcwnpin --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo motor-financeiro --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo motor-financeiro --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

