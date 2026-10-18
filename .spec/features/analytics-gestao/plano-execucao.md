# Plano de execução — analytics-gestao

> gerado por `onp-spec plano` em 2026-10-18 15:57 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano analytics-gestao --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 4 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/analytics-gestao`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-050 | Dashboard de Caixa, DRE Rápido e Quitação de Parcelas Pendentes | `claude-sonnet-5` | medium |
| T-051 | Monitoramento de Conexão WhatsApp e Tela de QR Code | `claude-sonnet-5` | medium |
| T-052 | Lista de Reativação de Clientes Inativos (>180 dias) com Atalho de WhatsApp | `claude-sonnet-5` | medium |
| T-053 | Suíte de Testes Automatizados TDD de Caixa, WhatsApp e Reativação de Clientes | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/analytics-gestao` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify analytics-gestao` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/analytics-gestao   # ou: git checkout spec/analytics-gestao
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-050

```
Você executa UMA tarefa da feature "analytics-gestao" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/analytics-gestao/spec.md, .spec/features/analytics-gestao/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-050 — "Dashboard de Caixa, DRE Rápido e Quitação de Parcelas Pendentes"
  critérios/refs: AC-070 (Dashboard de Indicadores Financeiros (Entrou no Caixa, A Receber, Despesas e Lucro)), AC-071 (Baixa Rápida de Parcelas Pendentes com Atualização Local e Outbox)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/components/CashFlowDashboard.tsx, frontend/src/features/analytics/components/ReceivablesList.tsx, frontend/src/features/analytics/utils/cash-calculator.ts
  mensagem de commit: "T-050 analytics-gestao: Dashboard de Caixa, DRE Rápido e Quitação de Parcelas Pendentes"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa analytics-gestao T-050 concluida` após o commit.

#### Prompt — T-051

```
Você executa UMA tarefa da feature "analytics-gestao" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/analytics-gestao/spec.md, .spec/features/analytics-gestao/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-051 — "Monitoramento de Conexão WhatsApp e Tela de QR Code"
  critérios/refs: AC-072 (Tela de QR Code e Banner de Alerta de Desconexão)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/components/WhatsAppPairingView.tsx, frontend/src/features/analytics/components/WhatsAppAlertBanner.tsx
  mensagem de commit: "T-051 analytics-gestao: Monitoramento de Conexão WhatsApp e Tela de QR Code"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa analytics-gestao T-051 concluida` após o commit.

#### Prompt — T-052

```
Você executa UMA tarefa da feature "analytics-gestao" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/analytics-gestao/spec.md, .spec/features/analytics-gestao/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-052 — "Lista de Reativação de Clientes Inativos (>180 dias) com Atalho de WhatsApp"
  critérios/refs: AC-073 (Lista de Pacientes Inativos (>180 dias) com Atalho Direto de WhatsApp)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/components/InactivePatientsList.tsx, frontend/src/features/analytics/utils/inactive-finder.ts
  mensagem de commit: "T-052 analytics-gestao: Lista de Reativação de Clientes Inativos (>180 dias) com Atalho de WhatsApp"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa analytics-gestao T-052 concluida` após o commit.

#### Prompt — T-053

```
Você executa UMA tarefa da feature "analytics-gestao" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/analytics-gestao/spec.md, .spec/features/analytics-gestao/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-053 — "Suíte de Testes Automatizados TDD de Caixa, WhatsApp e Reativação de Clientes"
  critérios/refs: AC-070 (Dashboard de Indicadores Financeiros (Entrou no Caixa, A Receber, Despesas e Lucro)), AC-071 (Baixa Rápida de Parcelas Pendentes com Atualização Local e Outbox), AC-072 (Tela de QR Code e Banner de Alerta de Desconexão), AC-073 (Lista de Pacientes Inativos (>180 dias) com Atalho Direto de WhatsApp)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/__tests__/analytics-ui.spec.tsx
  mensagem de commit: "T-053 analytics-gestao: Suíte de Testes Automatizados TDD de Caixa, WhatsApp e Reativação de Clientes"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa analytics-gestao T-053 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify analytics-gestao
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-analytics-gestao-mve0ebip --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-analytics-gestao-mve0ebip --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo analytics-gestao --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo analytics-gestao --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

