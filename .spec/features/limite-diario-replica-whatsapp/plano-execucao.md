# Plano de execução — limite-diario-replica-whatsapp

> gerado por `onp-spec plano` em 2026-10-27 18:55 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano limite-diario-replica-whatsapp --paralelizar T-147,T-148`

## Resumo — o que vai acontecer

- **2 tarefa(s) pendente(s)**: 2 em 2 faixa(s) paralela(s) + 0 sequencial(is)
- **seleção do usuário**: paralelizar só T-147, T-148 — as demais rodam uma após a outra, ao final
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano limite-diario-replica-whatsapp --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/limite-diario-replica-whatsapp`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/limite-diario-replica-whatsapp-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-limite-diario-replica-whatsapp-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-147 | Implementar verificação de limite diário de réplicas automáticas no Repositório e Parser | `claude-sonnet-5` | medium | `backend/src/db/schema.sql`, `backend/src/repositories/whatsapp-repository.ts`, `backend/src/whatsapp/parser.ts` |

#### faixa-2 — branch `spec/limite-diario-replica-whatsapp-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-limite-diario-replica-whatsapp-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-148 | Aplicar trava diária de réplica no WebhookService e suíte de testes automatizados | `claude-sonnet-5` | medium | `backend/src/services/webhook-service.ts`, `backend/src/whatsapp/__tests__/whatsapp-auto-reply.spec.ts`, `backend/src/services/__tests__/webhook-service.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/limite-diario-replica-whatsapp` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify limite-diario-replica-whatsapp` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/limite-diario-replica-whatsapp   # ou: git checkout spec/limite-diario-replica-whatsapp
git worktree add ../onp-worktrees/App-Agenda-Consultório-limite-diario-replica-whatsapp-faixa-1 -b spec/limite-diario-replica-whatsapp-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-limite-diario-replica-whatsapp-faixa-2 -b spec/limite-diario-replica-whatsapp-faixa-2
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "limite-diario-replica-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-limite-diario-replica-whatsapp-faixa-1 (branch spec/limite-diario-replica-whatsapp-faixa-1) — já preparado.
Leia primeiro: .spec/features/limite-diario-replica-whatsapp/spec.md, .spec/features/limite-diario-replica-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-147 — "Implementar verificação de limite diário de réplicas automáticas no Repositório e Parser"
  critérios/refs: AC-222 (Bloqueio de réplicas automáticas repetidas no mesmo dia para o mesmo paciente), AC-223 (Liberação do envio de réplica automática no dia seguinte e distinção de lembrete da fila)
  arquivos permitidos (e seus testes): backend/src/db/schema.sql, backend/src/repositories/whatsapp-repository.ts, backend/src/whatsapp/parser.ts
  mensagem de commit: "T-147 limite-diario-replica-whatsapp: Implementar verificação de limite diário de réplicas automáticas no Repositório e Parser"

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
Você executa as tarefas da faixa-2 da feature "limite-diario-replica-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-limite-diario-replica-whatsapp-faixa-2 (branch spec/limite-diario-replica-whatsapp-faixa-2) — já preparado.
Leia primeiro: .spec/features/limite-diario-replica-whatsapp/spec.md, .spec/features/limite-diario-replica-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-148 — "Aplicar trava diária de réplica no WebhookService e suíte de testes automatizados"
  critérios/refs: AC-222 (Bloqueio de réplicas automáticas repetidas no mesmo dia para o mesmo paciente), AC-223 (Liberação do envio de réplica automática no dia seguinte e distinção de lembrete da fila)
  arquivos permitidos (e seus testes): backend/src/services/webhook-service.ts, backend/src/whatsapp/__tests__/whatsapp-auto-reply.spec.ts, backend/src/services/__tests__/webhook-service.spec.ts
  mensagem de commit: "T-148 limite-diario-replica-whatsapp: Aplicar trava diária de réplica no WebhookService e suíte de testes automatizados"

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
git merge --no-ff spec/limite-diario-replica-whatsapp-faixa-1 -m "merge faixa-1 (limite-diario-replica-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-limite-diario-replica-whatsapp-faixa-1 && git branch -d spec/limite-diario-replica-whatsapp-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa limite-diario-replica-whatsapp T-147 concluida
git merge --no-ff spec/limite-diario-replica-whatsapp-faixa-2 -m "merge faixa-2 (limite-diario-replica-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-limite-diario-replica-whatsapp-faixa-2 && git branch -d spec/limite-diario-replica-whatsapp-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa limite-diario-replica-whatsapp T-148 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify limite-diario-replica-whatsapp
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-limite-diario-replica-whatsapp-mvr1pkjm --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-limite-diario-replica-whatsapp-mvr1pkjm --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo limite-diario-replica-whatsapp --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo limite-diario-replica-whatsapp --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

