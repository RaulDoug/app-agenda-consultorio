# Plano de execução — gabarito-templates-whatsapp

> gerado por `onp-spec plano` em 2026-10-27 19:43 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano gabarito-templates-whatsapp`

## Resumo — o que vai acontecer

- **3 tarefa(s) pendente(s)**: 3 em 1 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano gabarito-templates-whatsapp --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/gabarito-templates-whatsapp`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1

#### faixa-1 — branch `spec/gabarito-templates-whatsapp-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-gabarito-templates-whatsapp-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-153 | Implementar card informativo com gabarito de variáveis e Spintax no Frontend | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx`, `frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx` |
| T-154 | Adicionar chips de inserção rápida de variáveis nos campos de template | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx`, `frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx` |
| T-155 | Implementar prévia simulada em tempo real com dados de exemplo | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx`, `frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/gabarito-templates-whatsapp` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify gabarito-templates-whatsapp` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/gabarito-templates-whatsapp   # ou: git checkout spec/gabarito-templates-whatsapp
git worktree add ../onp-worktrees/App-Agenda-Consultório-gabarito-templates-whatsapp-faixa-1 -b spec/gabarito-templates-whatsapp-faixa-1
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "gabarito-templates-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-gabarito-templates-whatsapp-faixa-1 (branch spec/gabarito-templates-whatsapp-faixa-1) — já preparado.
Leia primeiro: .spec/features/gabarito-templates-whatsapp/spec.md, .spec/features/gabarito-templates-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-153 — "Implementar card informativo com gabarito de variáveis e Spintax no Frontend"
  critérios/refs: AC-227 (Exibição do painel informativo com gabarito de variáveis e regras de Spintax)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx, frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx
  mensagem de commit: "T-153 gabarito-templates-whatsapp: Implementar card informativo com gabarito de variáveis e Spintax no Frontend"
T-154 — "Adicionar chips de inserção rápida de variáveis nos campos de template"
  critérios/refs: AC-228 (Inserção rápida de variáveis e Spintax via botões/chips)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx, frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx
  mensagem de commit: "T-154 gabarito-templates-whatsapp: Adicionar chips de inserção rápida de variáveis nos campos de template"
T-155 — "Implementar prévia simulada em tempo real com dados de exemplo"
  critérios/refs: AC-229 (Prévia simulada em tempo real da mensagem)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx, frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx
  mensagem de commit: "T-155 gabarito-templates-whatsapp: Implementar prévia simulada em tempo real com dados de exemplo"

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
git merge --no-ff spec/gabarito-templates-whatsapp-faixa-1 -m "merge faixa-1 (gabarito-templates-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-gabarito-templates-whatsapp-faixa-1 && git branch -d spec/gabarito-templates-whatsapp-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa gabarito-templates-whatsapp T-153 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa gabarito-templates-whatsapp T-154 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa gabarito-templates-whatsapp T-155 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify gabarito-templates-whatsapp
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-gabarito-templates-whatsapp-mvr3f9p1 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-gabarito-templates-whatsapp-mvr3f9p1 --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo gabarito-templates-whatsapp --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo gabarito-templates-whatsapp --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

