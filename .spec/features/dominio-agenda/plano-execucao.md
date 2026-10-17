# Plano de execução — dominio-agenda

> gerado por `onp-spec plano` em 2026-10-17 18:53 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano dominio-agenda`

## Resumo — o que vai acontecer

- **7 tarefa(s) pendente(s)**: 7 em 2 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano dominio-agenda --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/dominio-agenda`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/dominio-agenda-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-dominio-agenda-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-001 | Modelagem dos Tipos e Contratos Compartilhados | `claude-sonnet-5` | medium | `shared/src/types/appointment.ts`, `shared/src/types/patient.ts`, `shared/src/types/procedure.ts`, `shared/src/types/business-hours.ts`, `shared/src/index.ts` |

#### faixa-2 — branch `spec/dominio-agenda-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-dominio-agenda-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-002 | Funções de Domínio: Duração Dinâmica e Validação de Procedimentos | `claude-sonnet-5` | medium | `backend/src/domain/duration.ts`, `backend/src/domain/__tests__/schedule-domain.spec.ts` |
| T-003 | Funções de Domínio: Normalização e Validação de Telefones WhatsApp | `claude-sonnet-5` | medium | `backend/src/domain/phone.ts`, `backend/src/domain/__tests__/schedule-domain.spec.ts` |
| T-004 | Funções de Domínio: Validação de Expediente e Encaixe com Soft-Warning | `claude-sonnet-5` | medium | `backend/src/domain/business-hours.ts`, `backend/src/domain/__tests__/schedule-domain.spec.ts` |
| T-005 | Funções de Domínio: Algoritmo de Retorno Inteligente | `claude-sonnet-5` | medium | `backend/src/domain/smart-return.ts`, `backend/src/domain/__tests__/schedule-domain.spec.ts` |
| T-006 | Funções de Domínio: Máquina de Estados e Imutabilidade de Status | `claude-sonnet-5` | medium | `backend/src/domain/appointment-state.ts`, `backend/src/domain/__tests__/schedule-domain.spec.ts` |
| T-007 | Funções de Domínio: Fuso Horário UTC-3 e Exportações | `claude-sonnet-5` | medium | `backend/src/domain/timezone.ts`, `backend/src/domain/index.ts`, `backend/src/domain/__tests__/schedule-domain.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/dominio-agenda` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify dominio-agenda` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/dominio-agenda   # ou: git checkout spec/dominio-agenda
git worktree add ../onp-worktrees/App-Agenda-Consultório-dominio-agenda-faixa-1 -b spec/dominio-agenda-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-dominio-agenda-faixa-2 -b spec/dominio-agenda-faixa-2
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "dominio-agenda" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-dominio-agenda-faixa-1 (branch spec/dominio-agenda-faixa-1) — já preparado.
Leia primeiro: .spec/features/dominio-agenda/spec.md, .spec/features/dominio-agenda/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-001 — "Modelagem dos Tipos e Contratos Compartilhados"
  critérios/refs: US-001, US-002, US-003, US-004, US-005, US-006
  arquivos permitidos (e seus testes): shared/src/types/appointment.ts, shared/src/types/patient.ts, shared/src/types/procedure.ts, shared/src/types/business-hours.ts, shared/src/index.ts
  mensagem de commit: "T-001 dominio-agenda: Modelagem dos Tipos e Contratos Compartilhados"

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
Você executa as tarefas da faixa-2 da feature "dominio-agenda" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-dominio-agenda-faixa-2 (branch spec/dominio-agenda-faixa-2) — já preparado.
Leia primeiro: .spec/features/dominio-agenda/spec.md, .spec/features/dominio-agenda/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-002 — "Funções de Domínio: Duração Dinâmica e Validação de Procedimentos"
  critérios/refs: AC-001 (Soma de durações determina o horário final), AC-002 (Rejeição de procedimentos com duração inválida)
  arquivos permitidos (e seus testes): backend/src/domain/duration.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
  mensagem de commit: "T-002 dominio-agenda: Funções de Domínio: Duração Dinâmica e Validação de Procedimentos"
T-003 — "Funções de Domínio: Normalização e Validação de Telefones WhatsApp"
  critérios/refs: AC-003 (Sanitização e formatação canônica de celular brasileiro), AC-004 (Rejeição de telefones inválidos)
  arquivos permitidos (e seus testes): backend/src/domain/phone.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
  mensagem de commit: "T-003 dominio-agenda: Funções de Domínio: Normalização e Validação de Telefones WhatsApp"
T-004 — "Funções de Domínio: Validação de Expediente e Encaixe com Soft-Warning"
  critérios/refs: AC-005 (Alerta de agendamento fora do expediente regular), AC-006 (Confirmação de encaixe extraordinário marca flag no agendamento)
  arquivos permitidos (e seus testes): backend/src/domain/business-hours.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
  mensagem de commit: "T-004 dominio-agenda: Funções de Domínio: Validação de Expediente e Encaixe com Soft-Warning"
T-005 — "Funções de Domínio: Algoritmo de Retorno Inteligente"
  critérios/refs: AC-007 (Sugestão de 3 slots vagos mais próximos em caso de conflito)
  arquivos permitidos (e seus testes): backend/src/domain/smart-return.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
  mensagem de commit: "T-005 dominio-agenda: Funções de Domínio: Algoritmo de Retorno Inteligente"
T-006 — "Funções de Domínio: Máquina de Estados e Imutabilidade de Status"
  critérios/refs: AC-008 (Validação de transições de status permitidas), AC-009 (Imutabilidade de consultas concluídas ou canceladas)
  arquivos permitidos (e seus testes): backend/src/domain/appointment-state.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
  mensagem de commit: "T-006 dominio-agenda: Funções de Domínio: Máquina de Estados e Imutabilidade de Status"
T-007 — "Funções de Domínio: Fuso Horário UTC-3 e Exportações"
  critérios/refs: AC-010 (Preservação da data civil no fuso America/Sao_Paulo)
  arquivos permitidos (e seus testes): backend/src/domain/timezone.ts, backend/src/domain/index.ts, backend/src/domain/__tests__/schedule-domain.spec.ts
  mensagem de commit: "T-007 dominio-agenda: Funções de Domínio: Fuso Horário UTC-3 e Exportações"

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
git merge --no-ff spec/dominio-agenda-faixa-1 -m "merge faixa-1 (dominio-agenda)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-dominio-agenda-faixa-1 && git branch -d spec/dominio-agenda-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa dominio-agenda T-001 concluida
git merge --no-ff spec/dominio-agenda-faixa-2 -m "merge faixa-2 (dominio-agenda)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-dominio-agenda-faixa-2 && git branch -d spec/dominio-agenda-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa dominio-agenda T-002 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa dominio-agenda T-003 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa dominio-agenda T-004 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa dominio-agenda T-005 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa dominio-agenda T-006 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa dominio-agenda T-007 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify dominio-agenda
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-dominio-agenda-mvcr8dgm --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-dominio-agenda-mvcr8dgm --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo dominio-agenda --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo dominio-agenda --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

