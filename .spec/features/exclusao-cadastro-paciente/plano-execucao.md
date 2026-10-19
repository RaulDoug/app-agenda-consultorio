# Plano de execução — exclusao-cadastro-paciente

> gerado por `onp-spec plano` em 2026-10-19 20:41 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano exclusao-cadastro-paciente`

## Resumo — o que vai acontecer

- **3 tarefa(s) pendente(s)**: 3 em 3 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano exclusao-cadastro-paciente --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/exclusao-cadastro-paciente`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/exclusao-cadastro-paciente-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-103 | Método deletePatient com soft-delete e mutação na outbox em PatientLocalRepository | `claude-sonnet-5` | medium | `frontend/src/db/repositories/patient-local-repository.ts` |

#### faixa-2 — branch `spec/exclusao-cadastro-paciente-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-104 | Ação de exclusão no PatientCard, modal de confirmação e integração reativa no App | `claude-sonnet-5` | medium | `frontend/src/features/patients/components/PatientCard.tsx`, `frontend/src/features/patients/components/ConfirmDeletePatientModal.tsx`, `frontend/src/features/patients/components/PatientList.tsx`, `frontend/src/features/patients/components/CreatePatientModal.tsx`, `frontend/src/App.tsx` |

#### faixa-3 — branch `spec/exclusao-cadastro-paciente-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-105 | Testes automatizados TDD com prova mecânica e auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/patients/__tests__/exclusao-paciente.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/exclusao-cadastro-paciente` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify exclusao-cadastro-paciente` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/exclusao-cadastro-paciente   # ou: git checkout spec/exclusao-cadastro-paciente
git worktree add ../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-1 -b spec/exclusao-cadastro-paciente-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-2 -b spec/exclusao-cadastro-paciente-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-3 -b spec/exclusao-cadastro-paciente-faixa-3
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "exclusao-cadastro-paciente" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-1 (branch spec/exclusao-cadastro-paciente-faixa-1) — já preparado.
Leia primeiro: .spec/features/exclusao-cadastro-paciente/spec.md, .spec/features/exclusao-cadastro-paciente/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-103 — "Método deletePatient com soft-delete e mutação na outbox em PatientLocalRepository"
  critérios/refs: AC-116 (Exclusão Lógica e Desativação no Repositório Local de Pacientes)
  arquivos permitidos (e seus testes): frontend/src/db/repositories/patient-local-repository.ts
  mensagem de commit: "T-103 exclusao-cadastro-paciente: Método deletePatient com soft-delete e mutação na outbox em PatientLocalRepository"

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
Você executa as tarefas da faixa-2 da feature "exclusao-cadastro-paciente" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-2 (branch spec/exclusao-cadastro-paciente-faixa-2) — já preparado.
Leia primeiro: .spec/features/exclusao-cadastro-paciente/spec.md, .spec/features/exclusao-cadastro-paciente/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-104 — "Ação de exclusão no PatientCard, modal de confirmação e integração reativa no App"
  critérios/refs: AC-117 (Ação de Exclusão no Card do Paciente e Modal de Confirmação)
  arquivos permitidos (e seus testes): frontend/src/features/patients/components/PatientCard.tsx, frontend/src/features/patients/components/ConfirmDeletePatientModal.tsx, frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/CreatePatientModal.tsx, frontend/src/App.tsx
  mensagem de commit: "T-104 exclusao-cadastro-paciente: Ação de exclusão no PatientCard, modal de confirmação e integração reativa no App"

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
Você executa as tarefas da faixa-3 da feature "exclusao-cadastro-paciente" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-3 (branch spec/exclusao-cadastro-paciente-faixa-3) — já preparado.
Leia primeiro: .spec/features/exclusao-cadastro-paciente/spec.md, .spec/features/exclusao-cadastro-paciente/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-105 — "Testes automatizados TDD com prova mecânica e auditoria CI"
  critérios/refs: AC-116 (Exclusão Lógica e Desativação no Repositório Local de Pacientes), AC-117 (Ação de Exclusão no Card do Paciente e Modal de Confirmação)
  arquivos permitidos (e seus testes): frontend/src/features/patients/__tests__/exclusao-paciente.spec.tsx
  mensagem de commit: "T-105 exclusao-cadastro-paciente: Testes automatizados TDD com prova mecânica e auditoria CI"

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
git merge --no-ff spec/exclusao-cadastro-paciente-faixa-1 -m "merge faixa-1 (exclusao-cadastro-paciente)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-1 && git branch -d spec/exclusao-cadastro-paciente-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa exclusao-cadastro-paciente T-103 concluida
git merge --no-ff spec/exclusao-cadastro-paciente-faixa-2 -m "merge faixa-2 (exclusao-cadastro-paciente)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-2 && git branch -d spec/exclusao-cadastro-paciente-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa exclusao-cadastro-paciente T-104 concluida
git merge --no-ff spec/exclusao-cadastro-paciente-faixa-3 -m "merge faixa-3 (exclusao-cadastro-paciente)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-exclusao-cadastro-paciente-faixa-3 && git branch -d spec/exclusao-cadastro-paciente-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa exclusao-cadastro-paciente T-105 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify exclusao-cadastro-paciente
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-exclusao-cadastro-paciente-mvfpzg6g --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-exclusao-cadastro-paciente-mvfpzg6g --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo exclusao-cadastro-paciente --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo exclusao-cadastro-paciente --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

