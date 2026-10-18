# Plano de execução — fundacao-frontend

> gerado por `onp-spec plano` em 2026-10-18 15:12 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano fundacao-frontend --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 3 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/fundacao-frontend`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-033 | Setup de Dependências, Vite, Tailwind CSS, Design Tokens e PWA Manifest | `claude-sonnet-5` | medium |
| T-034 | Implementação do Shell Adaptativo e Componentes de Navegação | `claude-sonnet-5` | medium |
| T-035 | Configuração da Infraestrutura de Testes e Suíte TDD Automatizada | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/fundacao-frontend` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify fundacao-frontend` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Sequencial no Antigravity (uma tarefa após a outra, sem Claude CLI)

1. **Entre na branch de trabalho** (terminal, na raiz do repositório):

```bash
git checkout -b spec/fundacao-frontend   # ou: git checkout spec/fundacao-frontend
```

2. **Execute as tarefas NA ORDEM, uma após a outra** (janela limpa por tarefa
   ajuda o foco; a próxima só começa quando a anterior commitou):

#### Prompt — T-033

```
Você executa UMA tarefa da feature "fundacao-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/fundacao-frontend/spec.md, .spec/features/fundacao-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-033 — "Setup de Dependências, Vite, Tailwind CSS, Design Tokens e PWA Manifest"
  critérios/refs: AC-051 (Tokens de design para status da agenda e botões acessíveis), AC-052 (Manifesto PWA e suíte de testes com fake-indexeddb e MSW)
  arquivos permitidos (e seus testes): frontend/package.json, frontend/vite.config.ts, frontend/tailwind.config.js, frontend/public/manifest.json, frontend/index.html
  mensagem de commit: "T-033 fundacao-frontend: Setup de Dependências, Vite, Tailwind CSS, Design Tokens e PWA Manifest"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa fundacao-frontend T-033 concluida` após o commit.

#### Prompt — T-034

```
Você executa UMA tarefa da feature "fundacao-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/fundacao-frontend/spec.md, .spec/features/fundacao-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-034 — "Implementação do Shell Adaptativo e Componentes de Navegação"
  critérios/refs: AC-049 (Layout Mobile com Bottom Navigation em viewports estreitos), AC-050 (Layout Desktop com Sidebar retrátil em viewports amplos)
  arquivos permitidos (e seus testes): frontend/src/components/layout/AppShell.tsx, frontend/src/components/layout/BottomNav.tsx, frontend/src/components/layout/DesktopSidebar.tsx, frontend/src/components/layout/TopBar.tsx, frontend/src/theme/tokens.ts
  mensagem de commit: "T-034 fundacao-frontend: Implementação do Shell Adaptativo e Componentes de Navegação"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa fundacao-frontend T-034 concluida` após o commit.

#### Prompt — T-035

```
Você executa UMA tarefa da feature "fundacao-frontend" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/fundacao-frontend/spec.md, .spec/features/fundacao-frontend/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-035 — "Configuração da Infraestrutura de Testes e Suíte TDD Automatizada"
  critérios/refs: AC-049 (Layout Mobile com Bottom Navigation em viewports estreitos), AC-050 (Layout Desktop com Sidebar retrátil em viewports amplos), AC-051 (Tokens de design para status da agenda e botões acessíveis), AC-052 (Manifesto PWA e suíte de testes com fake-indexeddb e MSW)
  arquivos permitidos (e seus testes): frontend/vitest.config.ts, frontend/src/test/setup.ts, frontend/playwright.config.ts, frontend/src/__tests__/fundacao-frontend.spec.tsx
  mensagem de commit: "T-035 fundacao-frontend: Configuração da Infraestrutura de Testes e Suíte TDD Automatizada"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx vitest run --passWithNoTests --reporter=json --outputFile=.spec/verification/raw.json` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.
```

`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa fundacao-frontend T-035 concluida` após o commit.

3. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify fundacao-frontend
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

4. **Acompanhamento (a cada ~1 min, enquanto executa)**: avise ANTES de começar
   que o trabalho roda em background e que o resumo completo vem ao final. Marque
   cada tarefa no ledger ao começar e ao terminar (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-fundacao-frontend-mvdyryku --tipo tarefa --tarefa <T-xxx> --faixa seq --estado executando   # ao começar
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-fundacao-frontend-mvdyryku --tipo tarefa --tarefa <T-xxx> --faixa seq --estado concluida    # após o commit
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo fundacao-frontend --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo fundacao-frontend --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

