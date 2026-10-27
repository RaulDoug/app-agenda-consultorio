# Plano de execução — reagendamento-mensagem-whatsapp

> gerado por `onp-spec plano` em 2026-10-27 18:19 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano reagendamento-mensagem-whatsapp --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 3 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/reagendamento-mensagem-whatsapp`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-144 | Atualizar parser semântico de WhatsApp no Backend | `claude-sonnet-5` | medium |
| T-145 | Alternar botão de confirmação manual para reagendamento na Central de WhatsApp | `claude-sonnet-5` | medium |
| T-146 | Integrar abertura do RescheduleModal e sincronização na Fila WhatsApp | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/reagendamento-mensagem-whatsapp` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify reagendamento-mensagem-whatsapp` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/reagendamento-mensagem-whatsapp   # ou: git checkout spec/reagendamento-mensagem-whatsapp
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-144

```
Você executa UMA tarefa da feature "reagendamento-mensagem-whatsapp" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/reagendamento-mensagem-whatsapp/spec.md, .spec/features/reagendamento-mensagem-whatsapp/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-144 — "Atualizar parser semântico de WhatsApp no Backend"
  critérios/refs: AC-219 (Reconhecimento semântico de pedido de agendamento e reagendamento no parser)
  arquivos permitidos (e seus testes): backend/src/whatsapp/parser.ts, backend/src/whatsapp/__tests__/whatsapp.spec.ts
  mensagem de commit: "T-144 reagendamento-mensagem-whatsapp: Atualizar parser semântico de WhatsApp no Backend"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa reagendamento-mensagem-whatsapp T-144 concluida` após o commit.

#### Prompt — T-145

```
Você executa UMA tarefa da feature "reagendamento-mensagem-whatsapp" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/reagendamento-mensagem-whatsapp/spec.md, .spec/features/reagendamento-mensagem-whatsapp/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-145 — "Alternar botão de confirmação manual para reagendamento na Central de WhatsApp"
  critérios/refs: AC-220 (Substituição do botão de confirmação manual por botão de reagendamento)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
  mensagem de commit: "T-145 reagendamento-mensagem-whatsapp: Alternar botão de confirmação manual para reagendamento na Central de WhatsApp"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa reagendamento-mensagem-whatsapp T-145 concluida` após o commit.

#### Prompt — T-146

```
Você executa UMA tarefa da feature "reagendamento-mensagem-whatsapp" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/reagendamento-mensagem-whatsapp/spec.md, .spec/features/reagendamento-mensagem-whatsapp/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-146 — "Integrar abertura do RescheduleModal e sincronização na Fila WhatsApp"
  critérios/refs: AC-221 (Acionamento e conclusão do modal de remarcação a partir da fila)
  arquivos permitidos (e seus testes): frontend/src/App.tsx, frontend/src/features/whatsapp/components/WhatsappQueueView.tsx, frontend/src/features/whatsapp/__tests__/WhatsappQueueView.spec.tsx
  mensagem de commit: "T-146 reagendamento-mensagem-whatsapp: Integrar abertura do RescheduleModal e sincronização na Fila WhatsApp"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa reagendamento-mensagem-whatsapp T-146 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify reagendamento-mensagem-whatsapp
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-reagendamento-mensagem-whatsapp-mvr0f5lu --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-reagendamento-mensagem-whatsapp-mvr0f5lu --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo reagendamento-mensagem-whatsapp --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo reagendamento-mensagem-whatsapp --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

