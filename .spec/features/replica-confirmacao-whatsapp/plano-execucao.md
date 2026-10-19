# Plano de execução — replica-confirmacao-whatsapp

> gerado por `onp-spec plano` em 2026-10-19 14:27 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano replica-confirmacao-whatsapp --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 3 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/replica-confirmacao-whatsapp`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-067 | Backend: Mapeamento e Disparo de Mensagens de Réplica no Webhook | `claude-sonnet-5` | medium |
| T-068 | Backend: Templates de Mensagens Humanizadas com Variação | `claude-sonnet-5` | medium |
| T-069 | Testes Automatizados com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/replica-confirmacao-whatsapp` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify replica-confirmacao-whatsapp` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/replica-confirmacao-whatsapp   # ou: git checkout spec/replica-confirmacao-whatsapp
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-067

```
Você executa UMA tarefa da feature "replica-confirmacao-whatsapp" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/replica-confirmacao-whatsapp/spec.md, .spec/features/replica-confirmacao-whatsapp/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-067 — "Backend: Mapeamento e Disparo de Mensagens de Réplica no Webhook"
  critérios/refs: AC-086 (Envio de réplica humanizada de confirmação ao receber resposta positiva), AC-087 (Envio de réplica humanizada de remarcação ao receber resposta negativa), AC-088 (Resiliência no envio da réplica sem impactar a gravação no banco de dados)
  arquivos permitidos (e seus testes): backend/src/routes/webhooks.ts
  mensagem de commit: "T-067 replica-confirmacao-whatsapp: Backend: Mapeamento e Disparo de Mensagens de Réplica no Webhook"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa replica-confirmacao-whatsapp T-067 concluida` após o commit.

#### Prompt — T-068

```
Você executa UMA tarefa da feature "replica-confirmacao-whatsapp" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/replica-confirmacao-whatsapp/spec.md, .spec/features/replica-confirmacao-whatsapp/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-068 — "Backend: Templates de Mensagens Humanizadas com Variação"
  critérios/refs: AC-086 (Envio de réplica humanizada de confirmação ao receber resposta positiva), AC-087 (Envio de réplica humanizada de remarcação ao receber resposta negativa)
  arquivos permitidos (e seus testes): backend/src/whatsapp/reply-templates.ts
  mensagem de commit: "T-068 replica-confirmacao-whatsapp: Backend: Templates de Mensagens Humanizadas com Variação"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa replica-confirmacao-whatsapp T-068 concluida` após o commit.

#### Prompt — T-069

```
Você executa UMA tarefa da feature "replica-confirmacao-whatsapp" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/replica-confirmacao-whatsapp/spec.md, .spec/features/replica-confirmacao-whatsapp/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-069 — "Testes Automatizados com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-086 (Envio de réplica humanizada de confirmação ao receber resposta positiva), AC-087 (Envio de réplica humanizada de remarcação ao receber resposta negativa), AC-088 (Resiliência no envio da réplica sem impactar a gravação no banco de dados)
  arquivos permitidos (e seus testes): backend/src/whatsapp/__tests__/whatsapp-auto-reply.spec.ts
  mensagem de commit: "T-069 replica-confirmacao-whatsapp: Testes Automatizados com Prova Mecânica e Auditoria CI"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa replica-confirmacao-whatsapp T-069 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify replica-confirmacao-whatsapp
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-replica-confirmacao-whatsapp-mvfcmmb2 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-replica-confirmacao-whatsapp-mvfcmmb2 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo replica-confirmacao-whatsapp --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo replica-confirmacao-whatsapp --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

