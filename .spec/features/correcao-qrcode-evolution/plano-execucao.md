# Plano de execução — correcao-qrcode-evolution

> gerado por `onp-spec plano` em 2026-10-19 13:24 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano correcao-qrcode-evolution --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 4 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/correcao-qrcode-evolution`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-063 | Backend: Tratamento Resiliente de QR Code sem Base64 Corrompido | `claude-sonnet-5` | medium |
| T-064 | Frontend: Placeholder com Spinner e Fallback Visual onError | `claude-sonnet-5` | medium |
| T-065 | Infraestrutura: Limpeza de Instâncias Órfãs na Evolution API | `claude-sonnet-5` | medium |
| T-066 | Testes Automatizados com Prova Mecânica e Auditoria CI | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/correcao-qrcode-evolution` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify correcao-qrcode-evolution` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/correcao-qrcode-evolution   # ou: git checkout spec/correcao-qrcode-evolution
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-063

```
Você executa UMA tarefa da feature "correcao-qrcode-evolution" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/correcao-qrcode-evolution/spec.md, .spec/features/correcao-qrcode-evolution/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-063 — "Backend: Tratamento Resiliente de QR Code sem Base64 Corrompido"
  critérios/refs: AC-083 (Backend não emite base64 corrompido e retorna qrcode nulo em caso de sessão em processamento)
  arquivos permitidos (e seus testes): backend/src/routes/whatsapp.ts
  mensagem de commit: "T-063 correcao-qrcode-evolution: Backend: Tratamento Resiliente de QR Code sem Base64 Corrompido"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcao-qrcode-evolution T-063 concluida` após o commit.

#### Prompt — T-064

```
Você executa UMA tarefa da feature "correcao-qrcode-evolution" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/correcao-qrcode-evolution/spec.md, .spec/features/correcao-qrcode-evolution/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-064 — "Frontend: Placeholder com Spinner e Fallback Visual onError"
  critérios/refs: AC-084 (Frontend exibe placeholder amigável com spinner e proteção contra falha de imagem)
  arquivos permitidos (e seus testes): frontend/src/features/analytics/components/WhatsAppPairingView.tsx
  mensagem de commit: "T-064 correcao-qrcode-evolution: Frontend: Placeholder com Spinner e Fallback Visual onError"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcao-qrcode-evolution T-064 concluida` após o commit.

#### Prompt — T-065

```
Você executa UMA tarefa da feature "correcao-qrcode-evolution" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/correcao-qrcode-evolution/spec.md, .spec/features/correcao-qrcode-evolution/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-065 — "Infraestrutura: Limpeza de Instâncias Órfãs na Evolution API"
  critérios/refs: AC-085 (Limpeza de instâncias órfãs e isolamento de sessão única na Evolution API)
  arquivos permitidos (e seus testes): backend/src/scripts/clean-evolution-instances.ts, backend/src/whatsapp/evolution-client.ts
  mensagem de commit: "T-065 correcao-qrcode-evolution: Infraestrutura: Limpeza de Instâncias Órfãs na Evolution API"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcao-qrcode-evolution T-065 concluida` após o commit.

#### Prompt — T-066

```
Você executa UMA tarefa da feature "correcao-qrcode-evolution" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/correcao-qrcode-evolution/spec.md, .spec/features/correcao-qrcode-evolution/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-066 — "Testes Automatizados com Prova Mecânica e Auditoria CI"
  critérios/refs: AC-083 (Backend não emite base64 corrompido e retorna qrcode nulo em caso de sessão em processamento), AC-084 (Frontend exibe placeholder amigável com spinner e proteção contra falha de imagem), AC-085 (Limpeza de instâncias órfãs e isolamento de sessão única na Evolution API)
  arquivos permitidos (e seus testes): backend/src/whatsapp/__tests__/whatsapp-qrcode-resilience.spec.ts, frontend/src/features/settings/__tests__/whatsapp-qrcode-resilience-ui.spec.tsx
  mensagem de commit: "T-066 correcao-qrcode-evolution: Testes Automatizados com Prova Mecânica e Auditoria CI"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa correcao-qrcode-evolution T-066 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify correcao-qrcode-evolution
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-correcao-qrcode-evolution-mvfadjrn --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-correcao-qrcode-evolution-mvfadjrn --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo correcao-qrcode-evolution --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo correcao-qrcode-evolution --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

