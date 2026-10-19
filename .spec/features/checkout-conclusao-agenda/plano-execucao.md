# Plano de execução — checkout-conclusao-agenda

> gerado por `onp-spec plano` em 2026-10-19 18:36 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano checkout-conclusao-agenda`

## Resumo — o que vai acontecer

- **3 tarefa(s) pendente(s)**: 3 em 2 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano checkout-conclusao-agenda --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/checkout-conclusao-agenda`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/checkout-conclusao-agenda-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-checkout-conclusao-agenda-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-082 | Frontend: Conexão do Botão de Conclusão com Abertura do CheckoutDrawer | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx`, `frontend/src/App.tsx` |
| T-083 | Frontend: Atualização do Agendamento para COMPLETED após Checkout | `claude-sonnet-5` | medium | `frontend/src/App.tsx` |

#### faixa-2 — branch `spec/checkout-conclusao-agenda-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-checkout-conclusao-agenda-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-084 | Testes Automatizados com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/agenda/__tests__/concluir-atendimento-checkout.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/checkout-conclusao-agenda` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify checkout-conclusao-agenda` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/checkout-conclusao-agenda   # ou: git checkout spec/checkout-conclusao-agenda
git worktree add ../onp-worktrees/App-Agenda-Consultório-checkout-conclusao-agenda-faixa-1 -b spec/checkout-conclusao-agenda-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-checkout-conclusao-agenda-faixa-2 -b spec/checkout-conclusao-agenda-faixa-2
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "checkout-conclusao-agenda" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-checkout-conclusao-agenda-faixa-1 (branch spec/checkout-conclusao-agenda-faixa-1) — já preparado.
Leia primeiro: .spec/features/checkout-conclusao-agenda/spec.md, .spec/features/checkout-conclusao-agenda/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-082 — "Frontend: Conexão do Botão de Conclusão com Abertura do CheckoutDrawer"
  critérios/refs: AC-098 (Abertura da gaveta de checkout e baixa financeira com atualização de status ao concluir atendimento)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx, frontend/src/App.tsx
  mensagem de commit: "T-082 checkout-conclusao-agenda: Frontend: Conexão do Botão de Conclusão com Abertura do CheckoutDrawer"
T-083 — "Frontend: Atualização do Agendamento para COMPLETED após Checkout"
  critérios/refs: AC-098 (Abertura da gaveta de checkout e baixa financeira com atualização de status ao concluir atendimento), AC-099 (Edição de valores de procedimentos e seleção de forma de pagamento no fluxo de encerramento da consulta)
  arquivos permitidos (e seus testes): frontend/src/App.tsx
  mensagem de commit: "T-083 checkout-conclusao-agenda: Frontend: Atualização do Agendamento para COMPLETED após Checkout"

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
Você executa as tarefas da faixa-2 da feature "checkout-conclusao-agenda" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-checkout-conclusao-agenda-faixa-2 (branch spec/checkout-conclusao-agenda-faixa-2) — já preparado.
Leia primeiro: .spec/features/checkout-conclusao-agenda/spec.md, .spec/features/checkout-conclusao-agenda/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-084 — "Testes Automatizados com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-098 (Abertura da gaveta de checkout e baixa financeira com atualização de status ao concluir atendimento), AC-099 (Edição de valores de procedimentos e seleção de forma de pagamento no fluxo de encerramento da consulta)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/__tests__/concluir-atendimento-checkout.spec.tsx
  mensagem de commit: "T-084 checkout-conclusao-agenda: Testes Automatizados com Prova Mecânica e Auditoria CI"

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
git merge --no-ff spec/checkout-conclusao-agenda-faixa-1 -m "merge faixa-1 (checkout-conclusao-agenda)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-checkout-conclusao-agenda-faixa-1 && git branch -d spec/checkout-conclusao-agenda-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa checkout-conclusao-agenda T-082 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa checkout-conclusao-agenda T-083 concluida
git merge --no-ff spec/checkout-conclusao-agenda-faixa-2 -m "merge faixa-2 (checkout-conclusao-agenda)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-checkout-conclusao-agenda-faixa-2 && git branch -d spec/checkout-conclusao-agenda-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa checkout-conclusao-agenda T-084 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify checkout-conclusao-agenda
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-checkout-conclusao-agenda-mvflj2j0 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-checkout-conclusao-agenda-mvflj2j0 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo checkout-conclusao-agenda --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo checkout-conclusao-agenda --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

