# Plano de execução — pareamento-whatsapp-live

> gerado por `onp-spec plano` em 2026-10-19 12:41 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano pareamento-whatsapp-live --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 4 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/pareamento-whatsapp-live`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-059 | Ajuste de Inicialização do Backend com TypeScript Watch | `claude-sonnet-5` | medium |
| T-060 | Ciclo de Vida da Sessão e Auto-Criação de Instância na Evolution API | `claude-sonnet-5` | medium |
| T-061 | Conexão do Frontend com QR Code Real e Polling Reativo nos Ajustes | `claude-sonnet-5` | medium |
| T-062 | Suíte de Testes com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/pareamento-whatsapp-live` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify pareamento-whatsapp-live` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/pareamento-whatsapp-live   # ou: git checkout spec/pareamento-whatsapp-live
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-059

```
Você executa UMA tarefa da feature "pareamento-whatsapp-live" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/pareamento-whatsapp-live/spec.md, .spec/features/pareamento-whatsapp-live/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-059 — "Ajuste de Inicialização do Backend com TypeScript Watch"
  critérios/refs: AC-079 (Inicialização do backend com tsx watch e flag de ambiente)
  arquivos permitidos (e seus testes): backend/package.json
  mensagem de commit: "T-059 pareamento-whatsapp-live: Ajuste de Inicialização do Backend com TypeScript Watch"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa pareamento-whatsapp-live T-059 concluida` após o commit.

#### Prompt — T-060

```
Você executa UMA tarefa da feature "pareamento-whatsapp-live" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/pareamento-whatsapp-live/spec.md, .spec/features/pareamento-whatsapp-live/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-060 — "Ciclo de Vida da Sessão e Auto-Criação de Instância na Evolution API"
  critérios/refs: AC-080 (Consulta de sessão com sincronização do estado e auto-criação de instância para QR Code), AC-081 (Desconexão controlada de instância WhatsApp via API)
  arquivos permitidos (e seus testes): backend/src/whatsapp/evolution-client.ts, backend/src/routes/whatsapp.ts
  mensagem de commit: "T-060 pareamento-whatsapp-live: Ciclo de Vida da Sessão e Auto-Criação de Instância na Evolution API"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa pareamento-whatsapp-live T-060 concluida` após o commit.

#### Prompt — T-061

```
Você executa UMA tarefa da feature "pareamento-whatsapp-live" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/pareamento-whatsapp-live/spec.md, .spec/features/pareamento-whatsapp-live/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-061 — "Conexão do Frontend com QR Code Real e Polling Reativo nos Ajustes"
  critérios/refs: AC-082 (Exibição dinâmica do QR Code e polling reativo de conexão na interface)
  arquivos permitidos (e seus testes): frontend/src/features/settings/components/SettingsView.tsx, frontend/src/App.tsx
  mensagem de commit: "T-061 pareamento-whatsapp-live: Conexão do Frontend com QR Code Real e Polling Reativo nos Ajustes"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa pareamento-whatsapp-live T-061 concluida` após o commit.

#### Prompt — T-062

```
Você executa UMA tarefa da feature "pareamento-whatsapp-live" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/pareamento-whatsapp-live/spec.md, .spec/features/pareamento-whatsapp-live/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-062 — "Suíte de Testes com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-079 (Inicialização do backend com tsx watch e flag de ambiente), AC-080 (Consulta de sessão com sincronização do estado e auto-criação de instância para QR Code), AC-081 (Desconexão controlada de instância WhatsApp via API), AC-082 (Exibição dinâmica do QR Code e polling reativo de conexão na interface)
  arquivos permitidos (e seus testes): backend/src/whatsapp/__tests__/whatsapp-live-pairing.spec.ts, frontend/src/features/settings/__tests__/whatsapp-live-pairing-ui.spec.tsx
  mensagem de commit: "T-062 pareamento-whatsapp-live: Suíte de Testes com Prova Mecânica e Auditoria CI"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa pareamento-whatsapp-live T-062 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify pareamento-whatsapp-live
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-pareamento-whatsapp-live-mvf8tgwc --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-pareamento-whatsapp-live-mvf8tgwc --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo pareamento-whatsapp-live --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo pareamento-whatsapp-live --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

