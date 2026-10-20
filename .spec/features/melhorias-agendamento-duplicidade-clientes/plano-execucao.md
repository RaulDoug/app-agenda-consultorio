# Plano de execução — melhorias-agendamento-duplicidade-clientes

> gerado por `onp-spec plano` em 2026-10-20 22:34 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano melhorias-agendamento-duplicidade-clientes`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 4 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano melhorias-agendamento-duplicidade-clientes --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/melhorias-agendamento-duplicidade-clientes`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/melhorias-agendamento-duplicidade-clientes-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-001 | Utilitário de Data/Horário Inteligente e Integração no Agendamento | `claude-sonnet-5` | medium | `frontend/src/features/agenda/utils/time-slots.ts`, `frontend/src/App.tsx`, `frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx` |
| T-002 | Exibição Condicional Estrita de Encaixe na Gaveta de Agendamento | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx` |

#### faixa-2 — branch `spec/melhorias-agendamento-duplicidade-clientes-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-003 | Validação de Duplicidade de WhatsApp no Repositório Local e Forms Frontend | `claude-sonnet-5` | medium | `frontend/src/db/repositories/patient-local-repository.ts`, `frontend/src/features/patients/components/CreatePatientModal.tsx`, `frontend/src/features/agenda/components/InlinePatientForm.tsx` |

#### faixa-3 — branch `spec/melhorias-agendamento-duplicidade-clientes-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-004 | Validação de Duplicidade de WhatsApp no Repositório e Serviço Backend | `claude-sonnet-5` | medium | `backend/src/repositories/patient-repository.ts`, `backend/src/services/patient-service.ts`, `backend/src/routes/patients.ts` |

### Onda 2 — faixa-4

#### faixa-4 — branch `spec/melhorias-agendamento-duplicidade-clientes-faixa-4` — worktree `../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-005 | Suíte de Testes Automatizados TDD, Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/agenda/__tests__/melhorias-agendamento-duplicidade.spec.tsx`, `backend/src/services/__tests__/patient-service.spec.ts`, `backend/src/routes/__tests__/patients.routes.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/melhorias-agendamento-duplicidade-clientes` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify melhorias-agendamento-duplicidade-clientes` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/melhorias-agendamento-duplicidade-clientes   # ou: git checkout spec/melhorias-agendamento-duplicidade-clientes
git worktree add ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-1 -b spec/melhorias-agendamento-duplicidade-clientes-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-2 -b spec/melhorias-agendamento-duplicidade-clientes-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-3 -b spec/melhorias-agendamento-duplicidade-clientes-faixa-3
git worktree add ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-4 -b spec/melhorias-agendamento-duplicidade-clientes-faixa-4
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "melhorias-agendamento-duplicidade-clientes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-1 (branch spec/melhorias-agendamento-duplicidade-clientes-faixa-1) — já preparado.
Leia primeiro: .spec/features/melhorias-agendamento-duplicidade-clientes/spec.md, .spec/features/melhorias-agendamento-duplicidade-clientes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-001 — "Utilitário de Data/Horário Inteligente e Integração no Agendamento"
  critérios/refs: AC-175 (Pré-seleção de data e horário inteligente sem horário passado e com avanço pós-expediente)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/utils/time-slots.ts, frontend/src/App.tsx, frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx
  mensagem de commit: "T-001 melhorias-agendamento-duplicidade-clientes: Utilitário de Data/Horário Inteligente e Integração no Agendamento"
T-002 — "Exibição Condicional Estrita de Encaixe na Gaveta de Agendamento"
  critérios/refs: AC-176 (Ocultação da opção de encaixe em horários regulares livres e exibição estrita sob conflito)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx
  mensagem de commit: "T-002 melhorias-agendamento-duplicidade-clientes: Exibição Condicional Estrita de Encaixe na Gaveta de Agendamento"

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
Você executa as tarefas da faixa-2 da feature "melhorias-agendamento-duplicidade-clientes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-2 (branch spec/melhorias-agendamento-duplicidade-clientes-faixa-2) — já preparado.
Leia primeiro: .spec/features/melhorias-agendamento-duplicidade-clientes/spec.md, .spec/features/melhorias-agendamento-duplicidade-clientes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-003 — "Validação de Duplicidade de WhatsApp no Repositório Local e Forms Frontend"
  critérios/refs: AC-177 (Bloqueio de cadastro e atualização de cliente com WhatsApp duplicado)
  arquivos permitidos (e seus testes): frontend/src/db/repositories/patient-local-repository.ts, frontend/src/features/patients/components/CreatePatientModal.tsx, frontend/src/features/agenda/components/InlinePatientForm.tsx
  mensagem de commit: "T-003 melhorias-agendamento-duplicidade-clientes: Validação de Duplicidade de WhatsApp no Repositório Local e Forms Frontend"

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
Você executa as tarefas da faixa-3 da feature "melhorias-agendamento-duplicidade-clientes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-3 (branch spec/melhorias-agendamento-duplicidade-clientes-faixa-3) — já preparado.
Leia primeiro: .spec/features/melhorias-agendamento-duplicidade-clientes/spec.md, .spec/features/melhorias-agendamento-duplicidade-clientes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-004 — "Validação de Duplicidade de WhatsApp no Repositório e Serviço Backend"
  critérios/refs: AC-177 (Bloqueio de cadastro e atualização de cliente com WhatsApp duplicado)
  arquivos permitidos (e seus testes): backend/src/repositories/patient-repository.ts, backend/src/services/patient-service.ts, backend/src/routes/patients.ts
  mensagem de commit: "T-004 melhorias-agendamento-duplicidade-clientes: Validação de Duplicidade de WhatsApp no Repositório e Serviço Backend"

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
Você executa as tarefas da faixa-4 da feature "melhorias-agendamento-duplicidade-clientes" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-4 (branch spec/melhorias-agendamento-duplicidade-clientes-faixa-4) — já preparado.
Leia primeiro: .spec/features/melhorias-agendamento-duplicidade-clientes/spec.md, .spec/features/melhorias-agendamento-duplicidade-clientes/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-005 — "Suíte de Testes Automatizados TDD, Prova Mecânica e Auditoria CI"
  critérios/refs: AC-175 (Pré-seleção de data e horário inteligente sem horário passado e com avanço pós-expediente), AC-176 (Ocultação da opção de encaixe em horários regulares livres e exibição estrita sob conflito), AC-177 (Bloqueio de cadastro e atualização de cliente com WhatsApp duplicado)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/__tests__/melhorias-agendamento-duplicidade.spec.tsx, backend/src/services/__tests__/patient-service.spec.ts, backend/src/routes/__tests__/patients.routes.spec.ts
  mensagem de commit: "T-005 melhorias-agendamento-duplicidade-clientes: Suíte de Testes Automatizados TDD, Prova Mecânica e Auditoria CI"

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
git merge --no-ff spec/melhorias-agendamento-duplicidade-clientes-faixa-1 -m "merge faixa-1 (melhorias-agendamento-duplicidade-clientes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-1 && git branch -d spec/melhorias-agendamento-duplicidade-clientes-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-agendamento-duplicidade-clientes T-001 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-agendamento-duplicidade-clientes T-002 concluida
git merge --no-ff spec/melhorias-agendamento-duplicidade-clientes-faixa-2 -m "merge faixa-2 (melhorias-agendamento-duplicidade-clientes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-2 && git branch -d spec/melhorias-agendamento-duplicidade-clientes-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-agendamento-duplicidade-clientes T-003 concluida
git merge --no-ff spec/melhorias-agendamento-duplicidade-clientes-faixa-3 -m "merge faixa-3 (melhorias-agendamento-duplicidade-clientes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-3 && git branch -d spec/melhorias-agendamento-duplicidade-clientes-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-agendamento-duplicidade-clientes T-004 concluida
git merge --no-ff spec/melhorias-agendamento-duplicidade-clientes-faixa-4 -m "merge faixa-4 (melhorias-agendamento-duplicidade-clientes)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-faixa-4 && git branch -d spec/melhorias-agendamento-duplicidade-clientes-faixa-4
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa melhorias-agendamento-duplicidade-clientes T-005 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify melhorias-agendamento-duplicidade-clientes
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-mvh9gxyn --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-melhorias-agendamento-duplicidade-clientes-mvh9gxyn --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo melhorias-agendamento-duplicidade-clientes --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo melhorias-agendamento-duplicidade-clientes --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

