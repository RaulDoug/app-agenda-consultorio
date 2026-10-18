# Plano de execução — agenda-pacientes

> gerado por `onp-spec plano` em 2026-10-18 15:33 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano agenda-pacientes --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 5 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/agenda-pacientes`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-040 | Componentes da Grade de Horários (Dia/Semana/Mês) em slots de 30m e Cards com Cores Semânticas | `claude-sonnet-5` | medium |
| T-041 | Gaveta de Criação Rápida (<10s) com Cadastro On-the-Fly e Alerta de Encaixe | `claude-sonnet-5` | medium |
| T-042 | Ações Rápidas de Status (Marcar Falta) e Modal de Remarcação com Calendário | `claude-sonnet-5` | medium |
| T-043 | Carteira de Clientes com Indicadores de Retorno/Cancelamento e Procedimentos Padrão | `claude-sonnet-5` | medium |
| T-044 | Suíte de Testes Automatizados TDD da Agenda e Pacientes no Frontend | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/agenda-pacientes` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify agenda-pacientes` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/agenda-pacientes   # ou: git checkout spec/agenda-pacientes
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-040

```
Você executa UMA tarefa da feature "agenda-pacientes" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/agenda-pacientes/spec.md, .spec/features/agenda-pacientes/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-040 — "Componentes da Grade de Horários (Dia/Semana/Mês) em slots de 30m e Cards com Cores Semânticas"
  critérios/refs: AC-057 (Renderização da Grade Diária com Slots de 30min e Alternância Dia/Semana/Mês), AC-058 (Identidade Visual e Badges Semânticos dos Cards de Consulta)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/ScheduleGrid.tsx, frontend/src/features/agenda/components/AppointmentCard.tsx, frontend/src/features/agenda/components/ViewModeSelector.tsx
  mensagem de commit: "T-040 agenda-pacientes: Componentes da Grade de Horários (Dia/Semana/Mês) em slots de 30m e Cards com Cores Semânticas"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agenda-pacientes T-040 concluida` após o commit.

#### Prompt — T-041

```
Você executa UMA tarefa da feature "agenda-pacientes" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/agenda-pacientes/spec.md, .spec/features/agenda-pacientes/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-041 — "Gaveta de Criação Rápida (<10s) com Cadastro On-the-Fly e Alerta de Encaixe"
  critérios/refs: AC-059 (Gaveta de Criação Rápida ao Tocar em Slot Vago com Cadastro On-the-Fly), AC-060 (Aviso de Sobreposição (Encaixe) e Proteção Contra Duplo Clique)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx, frontend/src/features/agenda/components/InlinePatientForm.tsx, frontend/src/features/agenda/components/InlineProcedureForm.tsx
  mensagem de commit: "T-041 agenda-pacientes: Gaveta de Criação Rápida (<10s) com Cadastro On-the-Fly e Alerta de Encaixe"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agenda-pacientes T-041 concluida` após o commit.

#### Prompt — T-042

```
Você executa UMA tarefa da feature "agenda-pacientes" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/agenda-pacientes/spec.md, .spec/features/agenda-pacientes/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-042 — "Ações Rápidas de Status (Marcar Falta) e Modal de Remarcação com Calendário"
  critérios/refs: AC-061 (Ação de 1 Toque para Marcar Falta (NO_SHOW) e Atualização de Status), AC-062 (Modal de Remarcação de Consulta com Calendário e Novos Horários)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx, frontend/src/features/agenda/components/RescheduleModal.tsx
  mensagem de commit: "T-042 agenda-pacientes: Ações Rápidas de Status (Marcar Falta) e Modal de Remarcação com Calendário"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agenda-pacientes T-042 concluida` após o commit.

#### Prompt — T-043

```
Você executa UMA tarefa da feature "agenda-pacientes" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/agenda-pacientes/spec.md, .spec/features/agenda-pacientes/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-043 — "Carteira de Clientes com Indicadores de Retorno/Cancelamento e Procedimentos Padrão"
  critérios/refs: AC-063 (Lista de Clientes com Indicadores de Histórico e Consultas Futuras), AC-064 (Procedimentos Padrão Genéricos e Múltiplos Procedimentos por Atendimento)
  arquivos permitidos (e seus testes): frontend/src/features/patients/components/PatientList.tsx, frontend/src/features/patients/components/PatientCard.tsx, frontend/src/features/agenda/hooks/useAgendaProcedures.ts
  mensagem de commit: "T-043 agenda-pacientes: Carteira de Clientes com Indicadores de Retorno/Cancelamento e Procedimentos Padrão"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agenda-pacientes T-043 concluida` após o commit.

#### Prompt — T-044

```
Você executa UMA tarefa da feature "agenda-pacientes" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/agenda-pacientes/spec.md, .spec/features/agenda-pacientes/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-044 — "Suíte de Testes Automatizados TDD da Agenda e Pacientes no Frontend"
  critérios/refs: AC-057 (Renderização da Grade Diária com Slots de 30min e Alternância Dia/Semana/Mês), AC-058 (Identidade Visual e Badges Semânticos dos Cards de Consulta), AC-059 (Gaveta de Criação Rápida ao Tocar em Slot Vago com Cadastro On-the-Fly), AC-060 (Aviso de Sobreposição (Encaixe) e Proteção Contra Duplo Clique), AC-061 (Ação de 1 Toque para Marcar Falta (NO_SHOW) e Atualização de Status), AC-062 (Modal de Remarcação de Consulta com Calendário e Novos Horários), AC-063 (Lista de Clientes com Indicadores de Histórico e Consultas Futuras), AC-064 (Procedimentos Padrão Genéricos e Múltiplos Procedimentos por Atendimento)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/__tests__/agenda-ui.spec.ts, frontend/src/features/patients/__tests__/patients-ui.spec.ts
  mensagem de commit: "T-044 agenda-pacientes: Suíte de Testes Automatizados TDD da Agenda e Pacientes no Frontend"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agenda-pacientes T-044 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify agenda-pacientes
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-agenda-pacientes-mvdziziw --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-agenda-pacientes-mvdziziw --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo agenda-pacientes --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo agenda-pacientes --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

