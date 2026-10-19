# Plano de execução — relatorios-fab-cadastro-paciente

> gerado por `onp-spec plano` em 2026-10-19 19:39 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano relatorios-fab-cadastro-paciente`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano relatorios-fab-cadastro-paciente --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/relatorios-fab-cadastro-paciente`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/relatorios-fab-cadastro-paciente-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-090 | Motor de Cálculo Offline-First de Relatórios e Métricas | `claude-sonnet-5` | medium | `frontend/src/features/analytics/utils/reports-calculator.ts` |

#### faixa-2 — branch `spec/relatorios-fab-cadastro-paciente-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-091 | Frontend: Componente de Tela de Relatórios & Métricas Gerenciais | `claude-sonnet-5` | medium | `frontend/src/features/analytics/components/ReportsView.tsx` |

#### faixa-3 — branch `spec/relatorios-fab-cadastro-paciente-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-092 | Frontend: Modal e Ação de Cadastro Direto de Pacientes | `claude-sonnet-5` | medium | `frontend/src/features/patients/components/CreatePatientModal.tsx`, `frontend/src/features/patients/components/PatientList.tsx` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/relatorios-fab-cadastro-paciente-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-093 | Frontend: Layout Mobile com Botão Central '+' Elevado e Hub 'Mais' | `claude-sonnet-5` | medium | `frontend/src/components/layout/BottomNav.tsx`, `frontend/src/components/layout/MoreMenuHub.tsx`, `frontend/src/components/layout/DesktopSidebar.tsx`, `frontend/src/components/layout/AppShell.tsx`, `frontend/src/App.tsx` |

#### faixa-5 — branch `spec/relatorios-fab-cadastro-paciente-faixa-5` — worktree `../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-094 | Testes Automatizados TDD com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/analytics/__tests__/relatorios-fab-paciente.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/relatorios-fab-cadastro-paciente` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify relatorios-fab-cadastro-paciente` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/relatorios-fab-cadastro-paciente   # ou: git checkout spec/relatorios-fab-cadastro-paciente
git worktree add ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-1 -b spec/relatorios-fab-cadastro-paciente-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-2 -b spec/relatorios-fab-cadastro-paciente-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-3 -b spec/relatorios-fab-cadastro-paciente-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-4 -b spec/relatorios-fab-cadastro-paciente-faixa-4
git worktree add ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-5 -b spec/relatorios-fab-cadastro-paciente-faixa-5
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "relatorios-fab-cadastro-paciente" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-1 (branch spec/relatorios-fab-cadastro-paciente-faixa-1) — já preparado.
Leia primeiro: .spec/features/relatorios-fab-cadastro-paciente/spec.md, .spec/features/relatorios-fab-cadastro-paciente/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-090 — "Motor de Cálculo Offline-First de Relatórios e Métricas"
  critérios/refs: AC-106 (Tela de Relatórios com indicadores de No-Show, DRE simplificado, projeção futura e ranking de procedimentos)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/utils/reports-calculator.ts
  mensagem de commit: "T-090 relatorios-fab-cadastro-paciente: Motor de Cálculo Offline-First de Relatórios e Métricas"

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
Você executa as tarefas da faixa-2 da feature "relatorios-fab-cadastro-paciente" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-2 (branch spec/relatorios-fab-cadastro-paciente-faixa-2) — já preparado.
Leia primeiro: .spec/features/relatorios-fab-cadastro-paciente/spec.md, .spec/features/relatorios-fab-cadastro-paciente/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-091 — "Frontend: Componente de Tela de Relatórios & Métricas Gerenciais"
  critérios/refs: AC-106 (Tela de Relatórios com indicadores de No-Show, DRE simplificado, projeção futura e ranking de procedimentos)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/components/ReportsView.tsx
  mensagem de commit: "T-091 relatorios-fab-cadastro-paciente: Frontend: Componente de Tela de Relatórios & Métricas Gerenciais"

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
Você executa as tarefas da faixa-3 da feature "relatorios-fab-cadastro-paciente" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-3 (branch spec/relatorios-fab-cadastro-paciente-faixa-3) — já preparado.
Leia primeiro: .spec/features/relatorios-fab-cadastro-paciente/spec.md, .spec/features/relatorios-fab-cadastro-paciente/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-092 — "Frontend: Modal e Ação de Cadastro Direto de Pacientes"
  critérios/refs: AC-107 (Cadastro direto de novo paciente com validação de dados a partir da tela de Clientes)
  arquivos permitidos (e seus testes): frontend/src/features/patients/components/CreatePatientModal.tsx, frontend/src/features/patients/components/PatientList.tsx
  mensagem de commit: "T-092 relatorios-fab-cadastro-paciente: Frontend: Modal e Ação de Cadastro Direto de Pacientes"

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
Você executa as tarefas da faixa-4 da feature "relatorios-fab-cadastro-paciente" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-4 (branch spec/relatorios-fab-cadastro-paciente-faixa-4) — já preparado.
Leia primeiro: .spec/features/relatorios-fab-cadastro-paciente/spec.md, .spec/features/relatorios-fab-cadastro-paciente/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-093 — "Frontend: Layout Mobile com Botão Central '+' Elevado e Hub 'Mais'"
  critérios/refs: AC-104 (Botão central '+' flutuante na barra inferior para acionamento direto do agendamento rápido), AC-105 (Distribuição de navegação mobile (Agenda, Caixa, [+], Relatórios, Mais) com acesso a Clientes e Ajustes)
  arquivos permitidos (e seus testes): frontend/src/components/layout/BottomNav.tsx, frontend/src/components/layout/MoreMenuHub.tsx, frontend/src/components/layout/DesktopSidebar.tsx, frontend/src/components/layout/AppShell.tsx, frontend/src/App.tsx
  mensagem de commit: "T-093 relatorios-fab-cadastro-paciente: Frontend: Layout Mobile com Botão Central '+' Elevado e Hub 'Mais'"

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
Você executa as tarefas da faixa-5 da feature "relatorios-fab-cadastro-paciente" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-5 (branch spec/relatorios-fab-cadastro-paciente-faixa-5) — já preparado.
Leia primeiro: .spec/features/relatorios-fab-cadastro-paciente/spec.md, .spec/features/relatorios-fab-cadastro-paciente/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-094 — "Testes Automatizados TDD com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-104 (Botão central '+' flutuante na barra inferior para acionamento direto do agendamento rápido), AC-105 (Distribuição de navegação mobile (Agenda, Caixa, [+], Relatórios, Mais) com acesso a Clientes e Ajustes), AC-106 (Tela de Relatórios com indicadores de No-Show, DRE simplificado, projeção futura e ranking de procedimentos), AC-107 (Cadastro direto de novo paciente com validação de dados a partir da tela de Clientes)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/__tests__/relatorios-fab-paciente.spec.tsx
  mensagem de commit: "T-094 relatorios-fab-cadastro-paciente: Testes Automatizados TDD com Prova Mecânica e Auditoria CI"

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
git merge --no-ff spec/relatorios-fab-cadastro-paciente-faixa-1 -m "merge faixa-1 (relatorios-fab-cadastro-paciente)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-1 && git branch -d spec/relatorios-fab-cadastro-paciente-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa relatorios-fab-cadastro-paciente T-090 concluida
git merge --no-ff spec/relatorios-fab-cadastro-paciente-faixa-2 -m "merge faixa-2 (relatorios-fab-cadastro-paciente)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-2 && git branch -d spec/relatorios-fab-cadastro-paciente-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa relatorios-fab-cadastro-paciente T-091 concluida
git merge --no-ff spec/relatorios-fab-cadastro-paciente-faixa-3 -m "merge faixa-3 (relatorios-fab-cadastro-paciente)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-3 && git branch -d spec/relatorios-fab-cadastro-paciente-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa relatorios-fab-cadastro-paciente T-092 concluida
git merge --no-ff spec/relatorios-fab-cadastro-paciente-faixa-4 -m "merge faixa-4 (relatorios-fab-cadastro-paciente)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-4 && git branch -d spec/relatorios-fab-cadastro-paciente-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa relatorios-fab-cadastro-paciente T-093 concluida
git merge --no-ff spec/relatorios-fab-cadastro-paciente-faixa-5 -m "merge faixa-5 (relatorios-fab-cadastro-paciente)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-relatorios-fab-cadastro-paciente-faixa-5 && git branch -d spec/relatorios-fab-cadastro-paciente-faixa-5
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa relatorios-fab-cadastro-paciente T-094 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify relatorios-fab-cadastro-paciente
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-relatorios-fab-cadastro-paciente-mvfnr4oc --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-relatorios-fab-cadastro-paciente-mvfnr4oc --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo relatorios-fab-cadastro-paciente --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo relatorios-fab-cadastro-paciente --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

