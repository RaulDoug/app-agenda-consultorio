# Plano de execução — sincronizacao-agendamentos

> gerado por `onp-spec plano` em 2026-10-20 21:47 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano sincronizacao-agendamentos --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 5 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/sincronizacao-agendamentos`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-001 | Backend Parser e Persistência de Mutações (POST /api/sync/batch) | `claude-sonnet-5` | medium |
| T-002 | Backend Idempotência, Last-Write-Wins e Validação de Conflito de Horário | `claude-sonnet-5` | medium |
| T-003 | Frontend SyncManager Push e Pull Enriquecido com Confirmação | `claude-sonnet-5` | medium |
| T-004 | Frontend Flush Automático no Logout e Alerta de Pendências | `claude-sonnet-5` | medium |
| T-005 | Testes Integrados, E2E e Documentação Técnica | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/sincronizacao-agendamentos` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify sincronizacao-agendamentos` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/sincronizacao-agendamentos   # ou: git checkout spec/sincronizacao-agendamentos
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-001

```
Você executa UMA tarefa da feature "sincronizacao-agendamentos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/sincronizacao-agendamentos/spec.md, .spec/features/sincronizacao-agendamentos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-001 — "Backend Parser e Persistência de Mutações (POST /api/sync/batch)"
  critérios/refs: AC-166 (Backend aceita mutações de agendamentos e itens via POST /api/sync/batch), AC-167 (Persistência atômica de agendamento e múltiplos procedimentos vinculados)
  arquivos permitidos (e seus testes): backend/src/routes/sync.ts, backend/src/routes/__tests__/api.spec.ts
  mensagem de commit: "T-001 sincronizacao-agendamentos: Backend Parser e Persistência de Mutações (POST /api/sync/batch)"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa sincronizacao-agendamentos T-001 concluida` após o commit.

#### Prompt — T-002

```
Você executa UMA tarefa da feature "sincronizacao-agendamentos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/sincronizacao-agendamentos/spec.md, .spec/features/sincronizacao-agendamentos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-002 — "Backend Idempotência, Last-Write-Wins e Validação de Conflito de Horário"
  critérios/refs: AC-169 (Idempotência em reenvios de lote com mesmo UUID), AC-170 (Resolução de conflito Last-Write-Wins por updated_at), AC-171 (Validação de choque de horários e liberação para encaixes)
  arquivos permitidos (e seus testes): backend/src/routes/sync.ts, backend/src/routes/__tests__/api.spec.ts
  mensagem de commit: "T-002 sincronizacao-agendamentos: Backend Idempotência, Last-Write-Wins e Validação de Conflito de Horário"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa sincronizacao-agendamentos T-002 concluida` após o commit.

#### Prompt — T-003

```
Você executa UMA tarefa da feature "sincronizacao-agendamentos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/sincronizacao-agendamentos/spec.md, .spec/features/sincronizacao-agendamentos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-003 — "Frontend SyncManager Push e Pull Enriquecido com Confirmação"
  critérios/refs: AC-168 (Confirmação e limpeza segura da fila sync_outbox no frontend), AC-174 (Restauração completa de agendamentos e procedimentos pós-login)
  arquivos permitidos (e seus testes): frontend/src/sync/sync-manager.ts, frontend/src/sync/__tests__/sync-manager.spec.ts
  mensagem de commit: "T-003 sincronizacao-agendamentos: Frontend SyncManager Push e Pull Enriquecido com Confirmação"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa sincronizacao-agendamentos T-003 concluida` após o commit.

#### Prompt — T-004

```
Você executa UMA tarefa da feature "sincronizacao-agendamentos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/sincronizacao-agendamentos/spec.md, .spec/features/sincronizacao-agendamentos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-004 — "Frontend Flush Automático no Logout e Alerta de Pendências"
  critérios/refs: AC-172 (Flush automático da fila outbox antes de efetuar logout), AC-173 (Alerta com contagem de pendências se o flush falhar por falta de rede)
  arquivos permitidos (e seus testes): frontend/src/features/auth/hooks/AuthContext.tsx, frontend/src/features/auth/hooks/__tests__/auth-context.spec.tsx, frontend/src/features/auth/components/LogoutConfirmDrawer.tsx
  mensagem de commit: "T-004 sincronizacao-agendamentos: Frontend Flush Automático no Logout e Alerta de Pendências"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa sincronizacao-agendamentos T-004 concluida` após o commit.

#### Prompt — T-005

```
Você executa UMA tarefa da feature "sincronizacao-agendamentos" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/sincronizacao-agendamentos/spec.md, .spec/features/sincronizacao-agendamentos/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-005 — "Testes Integrados, E2E e Documentação Técnica"
  critérios/refs: AC-174 (Restauração completa de agendamentos e procedimentos pós-login)
  arquivos permitidos (e seus testes): frontend/e2e/sync-appointments.spec.ts, docs/backend/funcionalidades/sincronizacao_agendamentos.md, docs/backend/funcionalidades/regras_globais.md
  mensagem de commit: "T-005 sincronizacao-agendamentos: Testes Integrados, E2E e Documentação Técnica"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa sincronizacao-agendamentos T-005 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify sincronizacao-agendamentos
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-sincronizacao-agendamentos-mvh7rc49 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-sincronizacao-agendamentos-mvh7rc49 --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo sincronizacao-agendamentos --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo sincronizacao-agendamentos --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

