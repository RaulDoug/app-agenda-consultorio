# Plano de execução — agendamento-atalho-paciente-preselecionado

> gerado por `onp-spec plano` em 2026-10-19 20:27 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano agendamento-atalho-paciente-preselecionado`

## Resumo — o que vai acontecer

- **2 tarefa(s) pendente(s)**: 2 em 2 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano agendamento-atalho-paciente-preselecionado --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/agendamento-atalho-paciente-preselecionado`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/agendamento-atalho-paciente-preselecionado-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-101 | Frontend: Suporte a initialPatient em QuickAppointmentDrawer.tsx e Conexão em App.tsx | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx`, `frontend/src/App.tsx` |

#### faixa-2 — branch `spec/agendamento-atalho-paciente-preselecionado-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-102 | Testes Automatizados TDD com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/agenda/__tests__/quick-appointment-preselected-patient.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/agendamento-atalho-paciente-preselecionado` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify agendamento-atalho-paciente-preselecionado` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/agendamento-atalho-paciente-preselecionado   # ou: git checkout spec/agendamento-atalho-paciente-preselecionado
git worktree add ../onp-worktrees/App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-faixa-1 -b spec/agendamento-atalho-paciente-preselecionado-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-faixa-2 -b spec/agendamento-atalho-paciente-preselecionado-faixa-2
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "agendamento-atalho-paciente-preselecionado" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-faixa-1 (branch spec/agendamento-atalho-paciente-preselecionado-faixa-1) — já preparado.
Leia primeiro: .spec/features/agendamento-atalho-paciente-preselecionado/spec.md, .spec/features/agendamento-atalho-paciente-preselecionado/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-101 — "Frontend: Suporte a initialPatient em QuickAppointmentDrawer.tsx e Conexão em App.tsx"
  critérios/refs: AC-114 (Pré-Seleção Automática do Paciente ao Acionar o Atalho "+ Agendar"), AC-115 (Isolamento e Reset de Seleção para Aberturas Avulsas)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx, frontend/src/App.tsx
  mensagem de commit: "T-101 agendamento-atalho-paciente-preselecionado: Frontend: Suporte a initialPatient em QuickAppointmentDrawer.tsx e Conexão em App.tsx"

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
Você executa as tarefas da faixa-2 da feature "agendamento-atalho-paciente-preselecionado" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-faixa-2 (branch spec/agendamento-atalho-paciente-preselecionado-faixa-2) — já preparado.
Leia primeiro: .spec/features/agendamento-atalho-paciente-preselecionado/spec.md, .spec/features/agendamento-atalho-paciente-preselecionado/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-102 — "Testes Automatizados TDD com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-114 (Pré-Seleção Automática do Paciente ao Acionar o Atalho "+ Agendar"), AC-115 (Isolamento e Reset de Seleção para Aberturas Avulsas)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/__tests__/quick-appointment-preselected-patient.spec.tsx
  mensagem de commit: "T-102 agendamento-atalho-paciente-preselecionado: Testes Automatizados TDD com Prova Mecânica e Auditoria CI"

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
git merge --no-ff spec/agendamento-atalho-paciente-preselecionado-faixa-1 -m "merge faixa-1 (agendamento-atalho-paciente-preselecionado)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-faixa-1 && git branch -d spec/agendamento-atalho-paciente-preselecionado-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agendamento-atalho-paciente-preselecionado T-101 concluida
git merge --no-ff spec/agendamento-atalho-paciente-preselecionado-faixa-2 -m "merge faixa-2 (agendamento-atalho-paciente-preselecionado)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-faixa-2 && git branch -d spec/agendamento-atalho-paciente-preselecionado-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agendamento-atalho-paciente-preselecionado T-102 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify agendamento-atalho-paciente-preselecionado
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-mvfphvpd --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-agendamento-atalho-paciente-preselecionado-mvfphvpd --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo agendamento-atalho-paciente-preselecionado --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo agendamento-atalho-paciente-preselecionado --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

