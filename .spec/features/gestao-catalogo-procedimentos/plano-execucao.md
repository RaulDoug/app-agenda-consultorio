# Plano de execução — gestao-catalogo-procedimentos

> gerado por `onp-spec plano` em 2026-10-28 14:18 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano gestao-catalogo-procedimentos --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 2 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal (5 já concluída(s): T-161, T-162, T-163, T-164, T-165)
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/gestao-catalogo-procedimentos`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-166 | Filtro de Procedimentos Inativos e Ação de Reativação no Frontend | `claude-sonnet-5` | medium |
| T-167 | Auto-Seed de Procedimentos Padrões no PostgreSQL e Sincronização Outbox | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/gestao-catalogo-procedimentos` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify gestao-catalogo-procedimentos` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/gestao-catalogo-procedimentos   # ou: git checkout spec/gestao-catalogo-procedimentos
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-166

```
Você executa UMA tarefa da feature "gestao-catalogo-procedimentos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/gestao-catalogo-procedimentos/spec.md, .spec/features/gestao-catalogo-procedimentos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-166 — "Filtro de Procedimentos Inativos e Ação de Reativação no Frontend"
  critérios/refs: AC-244 (Filtro de status na tela de catálogo e reativação em 1 clique)
  arquivos permitidos (e seus testes): frontend/src/features/procedures/components/ProcedureList.tsx, frontend/src/features/procedures/components/ProcedureCard.tsx, frontend/src/db/repositories/procedure-local-repository.ts, frontend/src/App.tsx, frontend/src/features/procedures/__tests__/gestao-procedimentos-ui.spec.tsx
  mensagem de commit: "T-166 gestao-catalogo-procedimentos: Filtro de Procedimentos Inativos e Ação de Reativação no Frontend"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa gestao-catalogo-procedimentos T-166 concluida` após o commit.

#### Prompt — T-167

```
Você executa UMA tarefa da feature "gestao-catalogo-procedimentos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/gestao-catalogo-procedimentos/spec.md, .spec/features/gestao-catalogo-procedimentos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-167 — "Auto-Seed de Procedimentos Padrões no PostgreSQL e Sincronização Outbox"
  critérios/refs: AC-245 (Auto-seed e persistência dos procedimentos padrões no backend PostgreSQL e sincronização de seeds da outbox)
  arquivos permitidos (e seus testes): backend/src/repositories/procedure-repository.ts, backend/src/routes/sync.ts, backend/src/repositories/__tests__/procedure-repository.spec.ts, frontend/src/db/repositories/procedure-local-repository.ts, frontend/src/sync/__tests__/sync-manager.spec.ts
  mensagem de commit: "T-167 gestao-catalogo-procedimentos: Auto-Seed de Procedimentos Padrões no PostgreSQL e Sincronização Outbox"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa gestao-catalogo-procedimentos T-167 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify gestao-catalogo-procedimentos
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-gestao-catalogo-procedimentos-mvs795p9 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-gestao-catalogo-procedimentos-mvs795p9 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo gestao-catalogo-procedimentos --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo gestao-catalogo-procedimentos --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

