# Plano de execução — ajustes-e2e-playwright

> gerado por `onp-spec plano` em 2026-10-18 16:09 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano ajustes-e2e-playwright --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 5 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/ajustes-e2e-playwright`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-054 | Repositório Local de Ajustes e Bloqueios com Outbox | `claude-sonnet-5` | medium |
| T-055 | Componente de Ajustes do Consultório e Bloqueios de Agenda | `claude-sonnet-5` | medium |
| T-056 | Integração Completa do AppShell com Todas as Abas e Status | `claude-sonnet-5` | medium |
| T-057 | Suíte de Testes Unitários e Componentes TDD de Ajustes e Integração | `claude-sonnet-5` | medium |
| T-058 | Suíte End-to-End Mobile e Resiliência Modo Avião (Playwright) | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/ajustes-e2e-playwright` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify ajustes-e2e-playwright` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/ajustes-e2e-playwright   # ou: git checkout spec/ajustes-e2e-playwright
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-054

```
Você executa UMA tarefa da feature "ajustes-e2e-playwright" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/ajustes-e2e-playwright/spec.md, .spec/features/ajustes-e2e-playwright/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-054 — "Repositório Local de Ajustes e Bloqueios com Outbox"
  critérios/refs: AC-074 (Configuração de horário de expediente e intervalo de almoço), AC-075 (Criação e remoção de bloqueios pontuais de agenda)
  arquivos permitidos (e seus testes): frontend/src/db/repositories/settings-local-repository.ts
  mensagem de commit: "T-054 ajustes-e2e-playwright: Repositório Local de Ajustes e Bloqueios com Outbox"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa ajustes-e2e-playwright T-054 concluida` após o commit.

#### Prompt — T-055

```
Você executa UMA tarefa da feature "ajustes-e2e-playwright" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/ajustes-e2e-playwright/spec.md, .spec/features/ajustes-e2e-playwright/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-055 — "Componente de Ajustes do Consultório e Bloqueios de Agenda"
  critérios/refs: AC-074 (Configuração de horário de expediente e intervalo de almoço), AC-075 (Criação e remoção de bloqueios pontuais de agenda)
  arquivos permitidos (e seus testes): frontend/src/features/settings/components/SettingsView.tsx, frontend/src/features/settings/components/ScheduleBlocksManager.tsx
  mensagem de commit: "T-055 ajustes-e2e-playwright: Componente de Ajustes do Consultório e Bloqueios de Agenda"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa ajustes-e2e-playwright T-055 concluida` após o commit.

#### Prompt — T-056

```
Você executa UMA tarefa da feature "ajustes-e2e-playwright" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/ajustes-e2e-playwright/spec.md, .spec/features/ajustes-e2e-playwright/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-056 — "Integração Completa do AppShell com Todas as Abas e Status"
  critérios/refs: AC-076 (Alternância fluida entre as abas principais com dados reativos)
  arquivos permitidos (e seus testes): frontend/src/App.tsx, frontend/src/components/layout/AppShell.tsx
  mensagem de commit: "T-056 ajustes-e2e-playwright: Integração Completa do AppShell com Todas as Abas e Status"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa ajustes-e2e-playwright T-056 concluida` após o commit.

#### Prompt — T-057

```
Você executa UMA tarefa da feature "ajustes-e2e-playwright" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/ajustes-e2e-playwright/spec.md, .spec/features/ajustes-e2e-playwright/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-057 — "Suíte de Testes Unitários e Componentes TDD de Ajustes e Integração"
  critérios/refs: AC-074 (Configuração de horário de expediente e intervalo de almoço), AC-075 (Criação e remoção de bloqueios pontuais de agenda), AC-076 (Alternância fluida entre as abas principais com dados reativos)
  arquivos permitidos (e seus testes): frontend/src/features/settings/__tests__/settings-ui.spec.tsx
  mensagem de commit: "T-057 ajustes-e2e-playwright: Suíte de Testes Unitários e Componentes TDD de Ajustes e Integração"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa ajustes-e2e-playwright T-057 concluida` após o commit.

#### Prompt — T-058

```
Você executa UMA tarefa da feature "ajustes-e2e-playwright" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/ajustes-e2e-playwright/spec.md, .spec/features/ajustes-e2e-playwright/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-058 — "Suíte End-to-End Mobile e Resiliência Modo Avião (Playwright)"
  critérios/refs: AC-077 (Jornada completa de atendimento mobile no Playwright), AC-078 (Resiliência offline em modo avião e sincronização ao reconectar)
  arquivos permitidos (e seus testes): frontend/e2e/cliniassist-mobile.spec.ts
  mensagem de commit: "T-058 ajustes-e2e-playwright: Suíte End-to-End Mobile e Resiliência Modo Avião (Playwright)"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa ajustes-e2e-playwright T-058 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify ajustes-e2e-playwright
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-ajustes-e2e-playwright-mve0t58m --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-ajustes-e2e-playwright-mve0t58m --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo ajustes-e2e-playwright --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo ajustes-e2e-playwright --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

