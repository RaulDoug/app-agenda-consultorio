# Plano de execução — correcoes-agenda-ux-reschedule

> gerado por `onp-spec plano` em 2026-10-19 17:57 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano correcoes-agenda-ux-reschedule`

## Resumo — o que vai acontecer

- **4 tarefa(s) pendente(s)**: 4 em 2 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano correcoes-agenda-ux-reschedule --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/correcoes-agenda-ux-reschedule`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/correcoes-agenda-ux-reschedule-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-ux-reschedule-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-075 | Frontend: Checkbox Explícito de Encaixe e Prevenção de Conflito em QuickAppointmentDrawer | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx` |
| T-076 | Frontend: Bloqueio de Scroll de Fundo e Backdrop Click nos Modais e Gavetas | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx`, `frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx`, `frontend/src/features/agenda/components/RescheduleModal.tsx` |
| T-077 | Frontend: Resiliência de Ciclo de Vida e Sincronização de Data em RescheduleModal | `claude-sonnet-5` | medium | `frontend/src/features/agenda/components/RescheduleModal.tsx` |

#### faixa-2 — branch `spec/correcoes-agenda-ux-reschedule-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-ux-reschedule-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-078 | Testes Automatizados com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium | `frontend/src/features/agenda/__tests__/agenda-ux-reschedule.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/correcoes-agenda-ux-reschedule` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify correcoes-agenda-ux-reschedule` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/correcoes-agenda-ux-reschedule   # ou: git checkout spec/correcoes-agenda-ux-reschedule
git worktree add ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-ux-reschedule-faixa-1 -b spec/correcoes-agenda-ux-reschedule-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-ux-reschedule-faixa-2 -b spec/correcoes-agenda-ux-reschedule-faixa-2
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "correcoes-agenda-ux-reschedule" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-ux-reschedule-faixa-1 (branch spec/correcoes-agenda-ux-reschedule-faixa-1) — já preparado.
Leia primeiro: .spec/features/correcoes-agenda-ux-reschedule/spec.md, .spec/features/correcoes-agenda-ux-reschedule/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-075 — "Frontend: Checkbox Explícito de Encaixe e Prevenção de Conflito em QuickAppointmentDrawer"
  critérios/refs: AC-093 (Checkbox explícito de autorização de encaixe em caso de sobreposição)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx
  mensagem de commit: "T-075 correcoes-agenda-ux-reschedule: Frontend: Checkbox Explícito de Encaixe e Prevenção de Conflito em QuickAppointmentDrawer"
T-076 — "Frontend: Bloqueio de Scroll de Fundo e Backdrop Click nos Modais e Gavetas"
  critérios/refs: AC-094 (Scroll lock no body e fechamento ao clicar fora do card)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/QuickAppointmentDrawer.tsx, frontend/src/features/agenda/components/AppointmentDetailsDrawer.tsx, frontend/src/features/agenda/components/RescheduleModal.tsx
  mensagem de commit: "T-076 correcoes-agenda-ux-reschedule: Frontend: Bloqueio de Scroll de Fundo e Backdrop Click nos Modais e Gavetas"
T-077 — "Frontend: Resiliência de Ciclo de Vida e Sincronização de Data em RescheduleModal"
  critérios/refs: AC-095 (Destravamento garantido e persistência de remarcação sem bloqueio de botão)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/components/RescheduleModal.tsx
  mensagem de commit: "T-077 correcoes-agenda-ux-reschedule: Frontend: Resiliência de Ciclo de Vida e Sincronização de Data em RescheduleModal"

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
Você executa as tarefas da faixa-2 da feature "correcoes-agenda-ux-reschedule" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-ux-reschedule-faixa-2 (branch spec/correcoes-agenda-ux-reschedule-faixa-2) — já preparado.
Leia primeiro: .spec/features/correcoes-agenda-ux-reschedule/spec.md, .spec/features/correcoes-agenda-ux-reschedule/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-078 — "Testes Automatizados com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-093 (Checkbox explícito de autorização de encaixe em caso de sobreposição), AC-094 (Scroll lock no body e fechamento ao clicar fora do card), AC-095 (Destravamento garantido e persistência de remarcação sem bloqueio de botão)
  arquivos permitidos (e seus testes): frontend/src/features/agenda/__tests__/agenda-ux-reschedule.spec.tsx
  mensagem de commit: "T-078 correcoes-agenda-ux-reschedule: Testes Automatizados com Prova Mecânica e Auditoria CI"

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
git merge --no-ff spec/correcoes-agenda-ux-reschedule-faixa-1 -m "merge faixa-1 (correcoes-agenda-ux-reschedule)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-ux-reschedule-faixa-1 && git branch -d spec/correcoes-agenda-ux-reschedule-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcoes-agenda-ux-reschedule T-075 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcoes-agenda-ux-reschedule T-076 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcoes-agenda-ux-reschedule T-077 concluida
git merge --no-ff spec/correcoes-agenda-ux-reschedule-faixa-2 -m "merge faixa-2 (correcoes-agenda-ux-reschedule)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-correcoes-agenda-ux-reschedule-faixa-2 && git branch -d spec/correcoes-agenda-ux-reschedule-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcoes-agenda-ux-reschedule T-078 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify correcoes-agenda-ux-reschedule
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-correcoes-agenda-ux-reschedule-mvfk4fd2 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-correcoes-agenda-ux-reschedule-mvfk4fd2 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo correcoes-agenda-ux-reschedule --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo correcoes-agenda-ux-reschedule --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

