# Plano de execução — card-procedimentos-agenda

> gerado por `onp-spec plano` em 2026-10-19 18:19 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano card-procedimentos-agenda`

## Resumo — o que vai acontecer

- **3 tarefa(s) pendente(s)**: 3 em 3 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano card-procedimentos-agenda --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/card-procedimentos-agenda`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/card-procedimentos-agenda-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-079 | Frontend: Layout Empilhado e Truncamento a 2 Itens em AppointmentCard | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/AppointmentCard.tsx` |

#### faixa-2 — branch `spec/card-procedimentos-agenda-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-080 | Frontend: Garantia de Listagem Completa na Gaveta de Detalhes | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx` |

#### faixa-3 — branch `spec/card-procedimentos-agenda-faixa-3` — worktree `../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-081 | Testes Automatizados com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/agenda/__tests__/card-procedures-layout.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/card-procedimentos-agenda` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify card-procedimentos-agenda` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/card-procedimentos-agenda   # ou: git checkout spec/card-procedimentos-agenda
git worktree add ../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-1 -b spec/card-procedimentos-agenda-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-2 -b spec/card-procedimentos-agenda-faixa-2
git worktree add ../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-3 -b spec/card-procedimentos-agenda-faixa-3
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "card-procedimentos-agenda" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-1 (branch spec/card-procedimentos-agenda-faixa-1) — já preparado.
Leia primeiro: .spec/features/card-procedimentos-agenda/spec.md, .spec/features/card-procedimentos-agenda/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-079 — "Frontend: Layout Empilhado e Truncamento a 2 Itens em AppointmentCard"
  critérios/refs: AC-096 (Renderização vertical limitada a no máximo 2 procedimentos com reticências no card fechado)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/AppointmentCard.tsx
  mensagem de commit: "T-079 card-procedimentos-agenda: Frontend: Layout Empilhado e Truncamento a 2 Itens em AppointmentCard"

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
Você executa as tarefas da faixa-2 da feature "card-procedimentos-agenda" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-2 (branch spec/card-procedimentos-agenda-faixa-2) — já preparado.
Leia primeiro: .spec/features/card-procedimentos-agenda/spec.md, .spec/features/card-procedimentos-agenda/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-080 — "Frontend: Garantia de Listagem Completa na Gaveta de Detalhes"
  critérios/refs: AC-097 (Exibição completa de todos os procedimentos na abertura da gaveta de detalhes)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx
  mensagem de commit: "T-080 card-procedimentos-agenda: Frontend: Garantia de Listagem Completa na Gaveta de Detalhes"

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
Você executa as tarefas da faixa-3 da feature "card-procedimentos-agenda" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-3 (branch spec/card-procedimentos-agenda-faixa-3) — já preparado.
Leia primeiro: .spec/features/card-procedimentos-agenda/spec.md, .spec/features/card-procedimentos-agenda/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-081 — "Testes Automatizados com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-096 (Renderização vertical limitada a no máximo 2 procedimentos com reticências no card fechado), AC-097 (Exibição completa de todos os procedimentos na abertura da gaveta de detalhes)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/__tests__/card-procedures-layout.spec.tsx
  mensagem de commit: "T-081 card-procedimentos-agenda: Testes Automatizados com Prova Mecânica e Auditoria CI"

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
git merge --no-ff spec/card-procedimentos-agenda-faixa-1 -m "merge faixa-1 (card-procedimentos-agenda)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-1 && git branch -d spec/card-procedimentos-agenda-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa card-procedimentos-agenda T-079 concluida
git merge --no-ff spec/card-procedimentos-agenda-faixa-2 -m "merge faixa-2 (card-procedimentos-agenda)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-2 && git branch -d spec/card-procedimentos-agenda-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa card-procedimentos-agenda T-080 concluida
git merge --no-ff spec/card-procedimentos-agenda-faixa-3 -m "merge faixa-3 (card-procedimentos-agenda)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-card-procedimentos-agenda-faixa-3 && git branch -d spec/card-procedimentos-agenda-faixa-3
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa card-procedimentos-agenda T-081 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify card-procedimentos-agenda
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-card-procedimentos-agenda-mvfkwl2y --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-card-procedimentos-agenda-mvfkwl2y --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo card-procedimentos-agenda --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo card-procedimentos-agenda --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

