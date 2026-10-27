# Plano de execução — resiliencia-bootstrap-sw-offline

> gerado por `onp-spec plano` em 2026-10-27 13:09 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano resiliencia-bootstrap-sw-offline --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 2 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/resiliencia-bootstrap-sw-offline`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-001 | Mover AuthenticatedApp para App.tsx e implementar mountApp idempotente em main.tsx | `claude-sonnet-5` | medium |
| T-002 | Refatorar sw.js para Network-First com trava de segurança GET e atualizar documentação | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/resiliencia-bootstrap-sw-offline` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify resiliencia-bootstrap-sw-offline` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/resiliencia-bootstrap-sw-offline   # ou: git checkout spec/resiliencia-bootstrap-sw-offline
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-001

```
Você executa UMA tarefa da feature "resiliencia-bootstrap-sw-offline" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/resiliencia-bootstrap-sw-offline/spec.md, .spec/features/resiliencia-bootstrap-sw-offline/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-001 — "Mover AuthenticatedApp para App.tsx e implementar mountApp idempotente em main.tsx"
  critérios/refs: AC-207 (Isolamento de AuthenticatedApp em App.tsx e Montagem Idempotente do React Root)
  arquivos permitidos (e seus testes): frontend/src/App.tsx, frontend/src/main.tsx, frontend/src/__tests__/bootstrap-sw-resilience.spec.tsx
  mensagem de commit: "T-001 resiliencia-bootstrap-sw-offline: Mover AuthenticatedApp para App.tsx e implementar mountApp idempotente em main.tsx"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa resiliencia-bootstrap-sw-offline T-001 concluida` após o commit.

#### Prompt — T-002

```
Você executa UMA tarefa da feature "resiliencia-bootstrap-sw-offline" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/resiliencia-bootstrap-sw-offline/spec.md, .spec/features/resiliencia-bootstrap-sw-offline/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-002 — "Refatorar sw.js para Network-First com trava de segurança GET e atualizar documentação"
  critérios/refs: AC-208 (Estratégia Network-First com Fallback Offline e Filtro de Segurança no Service Worker)
  arquivos permitidos (e seus testes): frontend/public/sw.js, frontend/src/__tests__/bootstrap-sw-resilience.spec.tsx, docs/frontend/funcionalidades/regras_globais.md
  mensagem de commit: "T-002 resiliencia-bootstrap-sw-offline: Refatorar sw.js para Network-First com trava de segurança GET e atualizar documentação"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa resiliencia-bootstrap-sw-offline T-002 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify resiliencia-bootstrap-sw-offline
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-resiliencia-bootstrap-sw-offline-mvqpd8cf --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-resiliencia-bootstrap-sw-offline-mvqpd8cf --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo resiliencia-bootstrap-sw-offline --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo resiliencia-bootstrap-sw-offline --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

