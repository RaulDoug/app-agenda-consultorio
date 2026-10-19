# Plano de execução — detalhes-edicao-paciente-observacoes

> gerado por `onp-spec plano` em 2026-10-19 20:15 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano detalhes-edicao-paciente-observacoes`

## Resumo — o que vai acontecer

- **4 tarefa(s) pendente(s)**: 4 em 4 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano detalhes-edicao-paciente-observacoes --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/detalhes-edicao-paciente-observacoes`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/detalhes-edicao-paciente-observacoes-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-097 | Frontend: Atualização de CreatePatientModal.tsx com Suporte ao Modo de Edição | `claude-sonnet-5` | medium | `frontend/src/features/patients/components/CreatePatientModal.tsx` |

#### faixa-2 — branch `spec/detalhes-edicao-paciente-observacoes-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-098 | Frontend: Expansão Interativa, Ícone Indicativo de Observações e Ação de Edição no Card | `claude-sonnet-5` | medium | `frontend/src/features/patients/components/PatientCard.tsx`, `frontend/src/features/patients/components/PatientList.tsx` |

#### faixa-3 — branch `spec/detalhes-edicao-paciente-observacoes-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-099 | Frontend: Destaque de Observações Clínicas em InlinePatientForm.tsx e Integração no App.tsx | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/InlinePatientForm.tsx`, `frontend/src/App.tsx` |

### Onda 2 — faixa-4

#### faixa-4 — branch `spec/detalhes-edicao-paciente-observacoes-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-100 | Testes Automatizados TDD com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/patients/__tests__/detalhes-edicao-paciente.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/detalhes-edicao-paciente-observacoes` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify detalhes-edicao-paciente-observacoes` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/detalhes-edicao-paciente-observacoes   # ou: git checkout spec/detalhes-edicao-paciente-observacoes
git worktree add ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-1 -b spec/detalhes-edicao-paciente-observacoes-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-2 -b spec/detalhes-edicao-paciente-observacoes-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-3 -b spec/detalhes-edicao-paciente-observacoes-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-4 -b spec/detalhes-edicao-paciente-observacoes-faixa-4
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "detalhes-edicao-paciente-observacoes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-1 (branch spec/detalhes-edicao-paciente-observacoes-faixa-1) — já preparado.
Leia primeiro: .spec/features/detalhes-edicao-paciente-observacoes/spec.md, .spec/features/detalhes-edicao-paciente-observacoes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-097 — "Frontend: Atualização de CreatePatientModal.tsx com Suporte ao Modo de Edição"
  critérios/refs: AC-112 (Ação de Edição no Card Expandido com Persistência no Banco Local)
  arquivos permitidos (e seus testes): frontend/src/features/patients/components/CreatePatientModal.tsx
  mensagem de commit: "T-097 detalhes-edicao-paciente-observacoes: Frontend: Atualização de CreatePatientModal.tsx com Suporte ao Modo de Edição"

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
Você executa as tarefas da faixa-2 da feature "detalhes-edicao-paciente-observacoes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-2 (branch spec/detalhes-edicao-paciente-observacoes-faixa-2) — já preparado.
Leia primeiro: .spec/features/detalhes-edicao-paciente-observacoes/spec.md, .spec/features/detalhes-edicao-paciente-observacoes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-098 — "Frontend: Expansão Interativa, Ícone Indicativo de Observações e Ação de Edição no Card"
  critérios/refs: AC-110 (Ícone Indicativo de Observações no Card do Paciente), AC-111 (Expansão Interativa do Card do Paciente com Detalhes e Observações), AC-112 (Ação de Edição no Card Expandido com Persistência no Banco Local)
  arquivos permitidos (e seus testes): frontend/src/features/patients/components/PatientCard.tsx, frontend/src/features/patients/components/PatientList.tsx
  mensagem de commit: "T-098 detalhes-edicao-paciente-observacoes: Frontend: Expansão Interativa, Ícone Indicativo de Observações e Ação de Edição no Card"

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
Você executa as tarefas da faixa-3 da feature "detalhes-edicao-paciente-observacoes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-3 (branch spec/detalhes-edicao-paciente-observacoes-faixa-3) — já preparado.
Leia primeiro: .spec/features/detalhes-edicao-paciente-observacoes/spec.md, .spec/features/detalhes-edicao-paciente-observacoes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-099 — "Frontend: Destaque de Observações Clínicas em InlinePatientForm.tsx e Integração no App.tsx"
  critérios/refs: AC-113 (Bloco de Observações Clínicas na Gaveta de Agendamento), AC-112 (Ação de Edição no Card Expandido com Persistência no Banco Local)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/InlinePatientForm.tsx, frontend/src/App.tsx
  mensagem de commit: "T-099 detalhes-edicao-paciente-observacoes: Frontend: Destaque de Observações Clínicas em InlinePatientForm.tsx e Integração no App.tsx"

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
Você executa as tarefas da faixa-4 da feature "detalhes-edicao-paciente-observacoes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-4 (branch spec/detalhes-edicao-paciente-observacoes-faixa-4) — já preparado.
Leia primeiro: .spec/features/detalhes-edicao-paciente-observacoes/spec.md, .spec/features/detalhes-edicao-paciente-observacoes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-100 — "Testes Automatizados TDD com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-110 (Ícone Indicativo de Observações no Card do Paciente), AC-111 (Expansão Interativa do Card do Paciente com Detalhes e Observações), AC-112 (Ação de Edição no Card Expandido com Persistência no Banco Local), AC-113 (Bloco de Observações Clínicas na Gaveta de Agendamento)
  arquivos permitidos (e seus testes): frontend/src/features/patients/__tests__/detalhes-edicao-paciente.spec.tsx
  mensagem de commit: "T-100 detalhes-edicao-paciente-observacoes: Testes Automatizados TDD com Prova Mecânica e Auditoria CI"

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
git merge --no-ff spec/detalhes-edicao-paciente-observacoes-faixa-1 -m "merge faixa-1 (detalhes-edicao-paciente-observacoes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-1 && git branch -d spec/detalhes-edicao-paciente-observacoes-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa detalhes-edicao-paciente-observacoes T-097 concluida
git merge --no-ff spec/detalhes-edicao-paciente-observacoes-faixa-2 -m "merge faixa-2 (detalhes-edicao-paciente-observacoes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-2 && git branch -d spec/detalhes-edicao-paciente-observacoes-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa detalhes-edicao-paciente-observacoes T-098 concluida
git merge --no-ff spec/detalhes-edicao-paciente-observacoes-faixa-3 -m "merge faixa-3 (detalhes-edicao-paciente-observacoes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-3 && git branch -d spec/detalhes-edicao-paciente-observacoes-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa detalhes-edicao-paciente-observacoes T-099 concluida
git merge --no-ff spec/detalhes-edicao-paciente-observacoes-faixa-4 -m "merge faixa-4 (detalhes-edicao-paciente-observacoes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-faixa-4 && git branch -d spec/detalhes-edicao-paciente-observacoes-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa detalhes-edicao-paciente-observacoes T-100 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify detalhes-edicao-paciente-observacoes
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-mvfp1uf0 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-detalhes-edicao-paciente-observacoes-mvfp1uf0 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo detalhes-edicao-paciente-observacoes --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo detalhes-edicao-paciente-observacoes --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

