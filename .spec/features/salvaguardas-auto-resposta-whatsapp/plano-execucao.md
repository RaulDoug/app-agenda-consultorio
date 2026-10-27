# Plano de execução — salvaguardas-auto-resposta-whatsapp

> gerado por `onp-spec plano` em 2026-10-27 20:11 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano salvaguardas-auto-resposta-whatsapp`

## Resumo — o que vai acontecer

- **2 tarefa(s) pendente(s)**: 2 em 2 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano salvaguardas-auto-resposta-whatsapp --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/salvaguardas-auto-resposta-whatsapp`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2

#### faixa-1 — branch `spec/salvaguardas-auto-resposta-whatsapp-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-159 | Implementar suporte a `auto_reply_scope`, salvaguardas de webhook e limpeza de `{nome}` no Backend | `claude-sonnet-5` | medium | `shared/src/types/whatsapp.ts`, `backend/src/repositories/whatsapp-repository.ts`, `backend/src/services/webhook-service.ts`, `backend/src/whatsapp/spintax.ts`, `backend/src/__tests__/whatsapp-auto-reply-safeguards.spec.ts` |

#### faixa-2 — branch `spec/salvaguardas-auto-resposta-whatsapp-faixa-2` — worktree `../onp-worktrees/App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-160 | Implementar seletor de escopo de resposta automática junto ao QR Code do WhatsApp no Frontend | `claude-sonnet-5` | medium | `frontend/src/features/analytics/components/WhatsAppPairingView.tsx`, `frontend/src/features/settings/components/SettingsView.tsx`, `frontend/src/App.tsx`, `frontend/src/features/settings/__tests__/settings-ui.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/salvaguardas-auto-resposta-whatsapp` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify salvaguardas-auto-resposta-whatsapp` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/salvaguardas-auto-resposta-whatsapp   # ou: git checkout spec/salvaguardas-auto-resposta-whatsapp
git worktree add ../onp-worktrees/App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-faixa-1 -b spec/salvaguardas-auto-resposta-whatsapp-faixa-1
git worktree add ../onp-worktrees/App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-faixa-2 -b spec/salvaguardas-auto-resposta-whatsapp-faixa-2
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "salvaguardas-auto-resposta-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-faixa-1 (branch spec/salvaguardas-auto-resposta-whatsapp-faixa-1) — já preparado.
Leia primeiro: .spec/features/salvaguardas-auto-resposta-whatsapp/spec.md, .spec/features/salvaguardas-auto-resposta-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-159 — "Implementar suporte a `auto_reply_scope`, salvaguardas de webhook e limpeza de `{nome}` no Backend"
  critérios/refs: AC-234 (Salvaguarda para modo Apenas Cadastrados (`REGISTERED_ONLY`) e modo Desativado (`DISABLED`)), AC-235 (Acolhimento automático para não cadastrados no modo `ALL` com limpeza de `{nome}` e limite diário), AC-236 (Bloqueio estrito de resposta automática para grupos, listas de transmissão e status)
  arquivos permitidos (e seus testes): shared/src/types/whatsapp.ts, backend/src/repositories/whatsapp-repository.ts, backend/src/services/webhook-service.ts, backend/src/whatsapp/spintax.ts, backend/src/__tests__/whatsapp-auto-reply-safeguards.spec.ts
  mensagem de commit: "T-159 salvaguardas-auto-resposta-whatsapp: Implementar suporte a `auto_reply_scope`, salvaguardas de webhook e limpeza de `{nome}` no Backend"

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
Você executa as tarefas da faixa-2 da feature "salvaguardas-auto-resposta-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-faixa-2 (branch spec/salvaguardas-auto-resposta-whatsapp-faixa-2) — já preparado.
Leia primeiro: .spec/features/salvaguardas-auto-resposta-whatsapp/spec.md, .spec/features/salvaguardas-auto-resposta-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-160 — "Implementar seletor de escopo de resposta automática junto ao QR Code do WhatsApp no Frontend"
  critérios/refs: AC-233 (Seletor de escopo de resposta automática junto ao card de QR Code do WhatsApp)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/components/WhatsAppPairingView.tsx, frontend/src/features/settings/components/SettingsView.tsx, frontend/src/App.tsx, frontend/src/features/settings/__tests__/settings-ui.spec.tsx
  mensagem de commit: "T-160 salvaguardas-auto-resposta-whatsapp: Implementar seletor de escopo de resposta automática junto ao QR Code do WhatsApp no Frontend"

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
git merge --no-ff spec/salvaguardas-auto-resposta-whatsapp-faixa-1 -m "merge faixa-1 (salvaguardas-auto-resposta-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-faixa-1 && git branch -d spec/salvaguardas-auto-resposta-whatsapp-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa salvaguardas-auto-resposta-whatsapp T-159 concluida
git merge --no-ff spec/salvaguardas-auto-resposta-whatsapp-faixa-2 -m "merge faixa-2 (salvaguardas-auto-resposta-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-faixa-2 && git branch -d spec/salvaguardas-auto-resposta-whatsapp-faixa-2
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa salvaguardas-auto-resposta-whatsapp T-160 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify salvaguardas-auto-resposta-whatsapp
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-mvr4fffy --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-salvaguardas-auto-resposta-whatsapp-mvr4fffy --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo salvaguardas-auto-resposta-whatsapp --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo salvaguardas-auto-resposta-whatsapp --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

