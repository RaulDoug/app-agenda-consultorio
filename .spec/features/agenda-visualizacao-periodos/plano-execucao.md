# Plano de execução — agenda-visualizacao-periodos

> gerado por `onp-spec plano` em 2026-10-27 12:28 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano agenda-visualizacao-periodos --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 4 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/agenda-visualizacao-periodos`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-133 | Criar utilitário de formatação de período e contagem de agendamentos | `claude-sonnet-5` | medium |
| T-134 | Atualizar ViewModeSelector com suporte a período dinâmico e contador | `claude-sonnet-5` | medium |
| T-135 | Integrar contador reativo e ajuste visual do botão em App.tsx | `claude-sonnet-5` | medium |
| T-136 | Implementar testes automatizados com prova mecânica | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/agenda-visualizacao-periodos` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify agenda-visualizacao-periodos` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/agenda-visualizacao-periodos   # ou: git checkout spec/agenda-visualizacao-periodos
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-133

```
Você executa UMA tarefa da feature "agenda-visualizacao-periodos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/agenda-visualizacao-periodos/spec.md, .spec/features/agenda-visualizacao-periodos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-133 — "Criar utilitário de formatação de período e contagem de agendamentos"
  critérios/refs: AC-204 (Formatação Dinâmica de Período no Cabeçalho da Agenda (Dia, Semana, Mês)), AC-205 (Contador Reativo de Atendimentos por Período Visualizado e Limpeza do Botão de Agendamento)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/utils/date-formatters.ts
  mensagem de commit: "T-133 agenda-visualizacao-periodos: Criar utilitário de formatação de período e contagem de agendamentos"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agenda-visualizacao-periodos T-133 concluida` após o commit.

#### Prompt — T-134

```
Você executa UMA tarefa da feature "agenda-visualizacao-periodos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/agenda-visualizacao-periodos/spec.md, .spec/features/agenda-visualizacao-periodos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-134 — "Atualizar ViewModeSelector com suporte a período dinâmico e contador"
  critérios/refs: AC-204 (Formatação Dinâmica de Período no Cabeçalho da Agenda (Dia, Semana, Mês)), AC-205 (Contador Reativo de Atendimentos por Período Visualizado e Limpeza do Botão de Agendamento)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/ViewModeSelector.tsx
  mensagem de commit: "T-134 agenda-visualizacao-periodos: Atualizar ViewModeSelector com suporte a período dinâmico e contador"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agenda-visualizacao-periodos T-134 concluida` após o commit.

#### Prompt — T-135

```
Você executa UMA tarefa da feature "agenda-visualizacao-periodos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/agenda-visualizacao-periodos/spec.md, .spec/features/agenda-visualizacao-periodos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-135 — "Integrar contador reativo e ajuste visual do botão em App.tsx"
  critérios/refs: AC-205 (Contador Reativo de Atendimentos por Período Visualizado e Limpeza do Botão de Agendamento)
  arquivos permitidos (e seus testes): frontend/src/App.tsx
  mensagem de commit: "T-135 agenda-visualizacao-periodos: Integrar contador reativo e ajuste visual do botão em App.tsx"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agenda-visualizacao-periodos T-135 concluida` após o commit.

#### Prompt — T-136

```
Você executa UMA tarefa da feature "agenda-visualizacao-periodos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/agenda-visualizacao-periodos/spec.md, .spec/features/agenda-visualizacao-periodos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-136 — "Implementar testes automatizados com prova mecânica"
  critérios/refs: AC-204 (Formatação Dinâmica de Período no Cabeçalho da Agenda (Dia, Semana, Mês)), AC-205 (Contador Reativo de Atendimentos por Período Visualizado e Limpeza do Botão de Agendamento)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/__tests__/agenda-visualizacao-periodos.spec.tsx
  mensagem de commit: "T-136 agenda-visualizacao-periodos: Implementar testes automatizados com prova mecânica"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa agenda-visualizacao-periodos T-136 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify agenda-visualizacao-periodos
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-agenda-visualizacao-periodos-mvqnwhxi --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-agenda-visualizacao-periodos-mvqnwhxi --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo agenda-visualizacao-periodos --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo agenda-visualizacao-periodos --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

