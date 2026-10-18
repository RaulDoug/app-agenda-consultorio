# Plano de execução — queries-analiticas

> gerado por `onp-spec plano` em 2026-10-18 13:42 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano queries-analiticas`

## Resumo — o que vai acontecer

- **3 tarefa(s) pendente(s)**: 3 em 3 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano queries-analiticas --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/queries-analiticas`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/queries-analiticas-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-023 | Repositório de Queries Analíticas SQL Otimizadas | `claude-sonnet-5` | medium | `backend/src/repositories/analytics-repository.ts` |

#### faixa-2 — branch `spec/queries-analiticas-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-024 | Rotas REST de Relatórios e Dashboard Gerencial | `claude-sonnet-5` | medium | `backend/src/routes/analytics.ts`, `backend/src/app.ts` |

#### faixa-3 — branch `spec/queries-analiticas-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-025 | Suíte Integrada de Testes Automatizados TDD de Analytics | `claude-sonnet-5` | medium | `backend/src/analytics/__tests__/analytics.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/queries-analiticas` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify queries-analiticas` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/queries-analiticas   # ou: git checkout spec/queries-analiticas
git worktree add ../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-1 -b spec/queries-analiticas-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-2 -b spec/queries-analiticas-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-3 -b spec/queries-analiticas-faixa-3
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "queries-analiticas" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-1 (branch spec/queries-analiticas-faixa-1) — já preparado.
Leia primeiro: .spec/features/queries-analiticas/spec.md, .spec/features/queries-analiticas/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-023 — "Repositório de Queries Analíticas SQL Otimizadas"
  critérios/refs: AC-035 (Cálculo exato da taxa de no-show e montante financeiro perdido), AC-036 (Resiliência a clínica nova (zero agendamentos sem divisão por zero)), AC-037 (Totalizador de receitas pagas, despesas e lucro líquido no período), AC-038 (Projeção de contas a receber pendentes em janelas de 30, 60 e 90 dias), AC-039 (Ranking de procedimentos mais rentáveis por receita efetiva), AC-040 (Identificação de pacientes inativos há mais de 180 dias sem agendamento futuro)
  arquivos permitidos (e seus testes): backend/src/repositories/analytics-repository.ts
  mensagem de commit: "T-023 queries-analiticas: Repositório de Queries Analíticas SQL Otimizadas"

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
Você executa as tarefas da faixa-2 da feature "queries-analiticas" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-2 (branch spec/queries-analiticas-faixa-2) — já preparado.
Leia primeiro: .spec/features/queries-analiticas/spec.md, .spec/features/queries-analiticas/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-024 — "Rotas REST de Relatórios e Dashboard Gerencial"
  critérios/refs: AC-035 (Cálculo exato da taxa de no-show e montante financeiro perdido), AC-036 (Resiliência a clínica nova (zero agendamentos sem divisão por zero)), AC-037 (Totalizador de receitas pagas, despesas e lucro líquido no período), AC-038 (Projeção de contas a receber pendentes em janelas de 30, 60 e 90 dias), AC-039 (Ranking de procedimentos mais rentáveis por receita efetiva), AC-040 (Identificação de pacientes inativos há mais de 180 dias sem agendamento futuro)
  arquivos permitidos (e seus testes): backend/src/routes/analytics.ts, backend/src/app.ts
  mensagem de commit: "T-024 queries-analiticas: Rotas REST de Relatórios e Dashboard Gerencial"

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
Você executa as tarefas da faixa-3 da feature "queries-analiticas" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-3 (branch spec/queries-analiticas-faixa-3) — já preparado.
Leia primeiro: .spec/features/queries-analiticas/spec.md, .spec/features/queries-analiticas/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-025 — "Suíte Integrada de Testes Automatizados TDD de Analytics"
  critérios/refs: AC-035 (Cálculo exato da taxa de no-show e montante financeiro perdido), AC-036 (Resiliência a clínica nova (zero agendamentos sem divisão por zero)), AC-037 (Totalizador de receitas pagas, despesas e lucro líquido no período), AC-038 (Projeção de contas a receber pendentes em janelas de 30, 60 e 90 dias), AC-039 (Ranking de procedimentos mais rentáveis por receita efetiva), AC-040 (Identificação de pacientes inativos há mais de 180 dias sem agendamento futuro)
  arquivos permitidos (e seus testes): backend/src/analytics/__tests__/analytics.spec.ts
  mensagem de commit: "T-025 queries-analiticas: Suíte Integrada de Testes Automatizados TDD de Analytics"

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
git merge --no-ff spec/queries-analiticas-faixa-1 -m "merge faixa-1 (queries-analiticas)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-1 && git branch -d spec/queries-analiticas-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa queries-analiticas T-023 concluida
git merge --no-ff spec/queries-analiticas-faixa-2 -m "merge faixa-2 (queries-analiticas)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-2 && git branch -d spec/queries-analiticas-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa queries-analiticas T-024 concluida
git merge --no-ff spec/queries-analiticas-faixa-3 -m "merge faixa-3 (queries-analiticas)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-queries-analiticas-faixa-3 && git branch -d spec/queries-analiticas-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa queries-analiticas T-025 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify queries-analiticas
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-queries-analiticas-mvdvk97m --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-queries-analiticas-mvdvk97m --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo queries-analiticas --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo queries-analiticas --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

