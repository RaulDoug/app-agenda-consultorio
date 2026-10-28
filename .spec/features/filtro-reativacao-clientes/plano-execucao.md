# Plano de execução — filtro-reativacao-clientes

> gerado por `onp-spec plano` em 2026-10-28 17:04 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano filtro-reativacao-clientes`

## Resumo — o que vai acontecer

- **6 tarefa(s) pendente(s)**: 6 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano filtro-reativacao-clientes --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/filtro-reativacao-clientes`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/filtro-reativacao-clientes-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-168 | Suporte a Reativação e Consulta de Inativos no Backend PostgreSQL | `claude-sonnet-5` | medium | `backend/src/repositories/patient-repository.ts`, `backend/src/services/patient-service.ts`, `backend/src/repositories/__tests__/patient-repository.spec.ts` |

#### faixa-2 — branch `spec/filtro-reativacao-clientes-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-169 | Método reactivatePatient e Busca por Telefone no Repositório Local | `claude-sonnet-5` | medium | `frontend/src/db/repositories/patient-local-repository.ts`, `frontend/src/db/repositories/__tests__/patient-local-repository.spec.ts` |

#### faixa-3 — branch `spec/filtro-reativacao-clientes-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-170 | Filtro de Status, Badges Visuais e Reativação em PatientList e PatientCard | `claude-sonnet-5` | medium | `frontend/src/features/patients/components/PatientList.tsx`, `frontend/src/features/patients/components/PatientCard.tsx`, `frontend/src/App.tsx`, `frontend/src/features/patients/__tests__/filtro-reativacao-paciente-ui.spec.tsx` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/filtro-reativacao-clientes-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-171 | Validação de WhatsApp Ativo/Inativo e Reativação nos Cadastros (Modal e Agenda) | `claude-sonnet-5` | medium | `frontend/src/features/patients/components/CreatePatientModal.tsx`, `frontend/src/features/agenda/components/InlinePatientForm.tsx`, `frontend/src/features/patients/__tests__/cadastro-duplicidade-reativacao.spec.tsx` |
| T-172 | Card de Lista de Pacientes Ordenada Alfabeticamente com Rolagem Dinâmica na Agenda | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/InlinePatientForm.tsx`, `frontend/src/features/agenda/__tests__/busca-dinamica-pacientes-agenda.spec.tsx` |

#### faixa-5 — branch `spec/filtro-reativacao-clientes-faixa-5` — worktree `../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-173 | Atualização da Documentação Técnica de Frontend e Backend | `claude-sonnet-5` | medium | `docs/frontend/funcionalidades/regras_globais.md`, `docs/frontend/funcionalidades/cadastro_clientes.md`, `docs/backend/funcionalidades/regras_globais.md`, `docs/backend/funcionalidades/cadastro_clientes.md` |

## Gestão de branches e commits

1. branch de trabalho `spec/filtro-reativacao-clientes` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify filtro-reativacao-clientes` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/filtro-reativacao-clientes   # ou: git checkout spec/filtro-reativacao-clientes
git worktree add ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-1 -b spec/filtro-reativacao-clientes-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-2 -b spec/filtro-reativacao-clientes-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-3 -b spec/filtro-reativacao-clientes-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-4 -b spec/filtro-reativacao-clientes-faixa-4
git worktree add ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-5 -b spec/filtro-reativacao-clientes-faixa-5
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "filtro-reativacao-clientes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-1 (branch spec/filtro-reativacao-clientes-faixa-1) — já preparado.
Leia primeiro: .spec/features/filtro-reativacao-clientes/spec.md, .spec/features/filtro-reativacao-clientes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-168 — "Suporte a Reativação e Consulta de Inativos no Backend PostgreSQL"
  critérios/refs: AC-249 (Consulta de inativos e restauração de clientes soft-deleted na API)
  arquivos permitidos (e seus testes): backend/src/repositories/patient-repository.ts, backend/src/services/patient-service.ts, backend/src/repositories/__tests__/patient-repository.spec.ts
  mensagem de commit: "T-168 filtro-reativacao-clientes: Suporte a Reativação e Consulta de Inativos no Backend PostgreSQL"

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
Você executa as tarefas da faixa-2 da feature "filtro-reativacao-clientes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-2 (branch spec/filtro-reativacao-clientes-faixa-2) — já preparado.
Leia primeiro: .spec/features/filtro-reativacao-clientes/spec.md, .spec/features/filtro-reativacao-clientes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-169 — "Método reactivatePatient e Busca por Telefone no Repositório Local"
  critérios/refs: AC-248 (Método reactivatePatient e salvaguarda contra telefone duplicado)
  arquivos permitidos (e seus testes): frontend/src/db/repositories/patient-local-repository.ts, frontend/src/db/repositories/__tests__/patient-local-repository.spec.ts
  mensagem de commit: "T-169 filtro-reativacao-clientes: Método reactivatePatient e Busca por Telefone no Repositório Local"

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
Você executa as tarefas da faixa-3 da feature "filtro-reativacao-clientes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-3 (branch spec/filtro-reativacao-clientes-faixa-3) — já preparado.
Leia primeiro: .spec/features/filtro-reativacao-clientes/spec.md, .spec/features/filtro-reativacao-clientes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-170 — "Filtro de Status, Badges Visuais e Reativação em PatientList e PatientCard"
  critérios/refs: AC-246 (Filtro de status na tela de clientes com contadores e busca contextual), AC-247 (Identificação visual de clientes inativos e reativação direta em 1 toque)
  arquivos permitidos (e seus testes): frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/PatientCard.tsx, frontend/src/App.tsx, frontend/src/features/patients/__tests__/filtro-reativacao-paciente-ui.spec.tsx
  mensagem de commit: "T-170 filtro-reativacao-clientes: Filtro de Status, Badges Visuais e Reativação em PatientList e PatientCard"

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
Você executa as tarefas da faixa-4 da feature "filtro-reativacao-clientes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-4 (branch spec/filtro-reativacao-clientes-faixa-4) — já preparado.
Leia primeiro: .spec/features/filtro-reativacao-clientes/spec.md, .spec/features/filtro-reativacao-clientes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-171 — "Validação de WhatsApp Ativo/Inativo e Reativação nos Cadastros (Modal e Agenda)"
  critérios/refs: AC-250 (Validação de WhatsApp com proposta de reativação de cliente inativo)
  arquivos permitidos (e seus testes): frontend/src/features/patients/components/CreatePatientModal.tsx, frontend/src/features/agenda/components/InlinePatientForm.tsx, frontend/src/features/patients/__tests__/cadastro-duplicidade-reativacao.spec.tsx
  mensagem de commit: "T-171 filtro-reativacao-clientes: Validação de WhatsApp Ativo/Inativo e Reativação nos Cadastros (Modal e Agenda)"
T-172 — "Card de Lista de Pacientes Ordenada Alfabeticamente com Rolagem Dinâmica na Agenda"
  critérios/refs: AC-251 (Listagem alfabética com paginação dinâmica por scroll no formulário de agendamento)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/InlinePatientForm.tsx, frontend/src/features/agenda/__tests__/busca-dinamica-pacientes-agenda.spec.tsx
  mensagem de commit: "T-172 filtro-reativacao-clientes: Card de Lista de Pacientes Ordenada Alfabeticamente com Rolagem Dinâmica na Agenda"

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
Você executa as tarefas da faixa-5 da feature "filtro-reativacao-clientes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-5 (branch spec/filtro-reativacao-clientes-faixa-5) — já preparado.
Leia primeiro: .spec/features/filtro-reativacao-clientes/spec.md, .spec/features/filtro-reativacao-clientes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-173 — "Atualização da Documentação Técnica de Frontend e Backend"
  critérios/refs: AC-246 (Filtro de status na tela de clientes com contadores e busca contextual), AC-247 (Identificação visual de clientes inativos e reativação direta em 1 toque), AC-248 (Método reactivatePatient e salvaguarda contra telefone duplicado), AC-249 (Consulta de inativos e restauração de clientes soft-deleted na API), AC-250 (Validação de WhatsApp com proposta de reativação de cliente inativo), AC-251 (Listagem alfabética com paginação dinâmica por scroll no formulário de agendamento)
  arquivos permitidos (e seus testes): docs/frontend/funcionalidades/regras_globais.md, docs/frontend/funcionalidades/cadastro_clientes.md, docs/backend/funcionalidades/regras_globais.md, docs/backend/funcionalidades/cadastro_clientes.md
  mensagem de commit: "T-173 filtro-reativacao-clientes: Atualização da Documentação Técnica de Frontend e Backend"

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
git merge --no-ff spec/filtro-reativacao-clientes-faixa-1 -m "merge faixa-1 (filtro-reativacao-clientes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-1 && git branch -d spec/filtro-reativacao-clientes-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa filtro-reativacao-clientes T-168 concluida
git merge --no-ff spec/filtro-reativacao-clientes-faixa-2 -m "merge faixa-2 (filtro-reativacao-clientes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-2 && git branch -d spec/filtro-reativacao-clientes-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa filtro-reativacao-clientes T-169 concluida
git merge --no-ff spec/filtro-reativacao-clientes-faixa-3 -m "merge faixa-3 (filtro-reativacao-clientes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-3 && git branch -d spec/filtro-reativacao-clientes-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa filtro-reativacao-clientes T-170 concluida
git merge --no-ff spec/filtro-reativacao-clientes-faixa-4 -m "merge faixa-4 (filtro-reativacao-clientes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-4 && git branch -d spec/filtro-reativacao-clientes-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa filtro-reativacao-clientes T-171 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa filtro-reativacao-clientes T-172 concluida
git merge --no-ff spec/filtro-reativacao-clientes-faixa-5 -m "merge faixa-5 (filtro-reativacao-clientes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-filtro-reativacao-clientes-faixa-5 && git branch -d spec/filtro-reativacao-clientes-faixa-5
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa filtro-reativacao-clientes T-173 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify filtro-reativacao-clientes
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-filtro-reativacao-clientes-mvsd702u --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-filtro-reativacao-clientes-mvsd702u --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo filtro-reativacao-clientes --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo filtro-reativacao-clientes --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

