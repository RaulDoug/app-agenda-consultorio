# Plano de execução — cards-expansiveis-templates-whatsapp

> gerado por `onp-spec plano` em 2026-10-27 19:52 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano cards-expansiveis-templates-whatsapp`

## Resumo — o que vai acontecer

- **3 tarefa(s) pendente(s)**: 3 em 1 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano cards-expansiveis-templates-whatsapp --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/cards-expansiveis-templates-whatsapp`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1

#### faixa-1 — branch `spec/cards-expansiveis-templates-whatsapp-faixa-1` — worktree `../onp-worktrees/App-Agenda-Consultório-cards-expansiveis-templates-whatsapp-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-156 | Implementar accordion e cards expansíveis individuais no Frontend | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx`, `frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx` |
| T-157 | Exibir prévia contextual em tempo real dentro de cada card expandido | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx`, `frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx` |
| T-158 | Implementar botão de salvar individual com feedback visual por card | `claude-sonnet-5` | medium | `frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx`, `frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx` |

## Gestão de branches e commits

1. branch de trabalho `spec/cards-expansiveis-templates-whatsapp` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify cards-expansiveis-templates-whatsapp` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Paralelo nativo no Antigravity (janelas limpas, sem Claude CLI)

1. **Prepare a branch de trabalho e os worktrees** (terminal, na raiz do repositório):

```bash
git checkout -b spec/cards-expansiveis-templates-whatsapp   # ou: git checkout spec/cards-expansiveis-templates-whatsapp
git worktree add ../onp-worktrees/App-Agenda-Consultório-cards-expansiveis-templates-whatsapp-faixa-1 -b spec/cards-expansiveis-templates-whatsapp-faixa-1
```

2. **Abra um agente NOVO por faixa** (janela limpa) e cole o prompt da faixa:

#### Prompt — faixa-1

```
Você executa as tarefas da faixa-1 da feature "cards-expansiveis-templates-whatsapp" (fluxo onp-spec, spec-anchored).
Trabalhe SOMENTE dentro do worktree ../onp-worktrees/App-Agenda-Consultório-cards-expansiveis-templates-whatsapp-faixa-1 (branch spec/cards-expansiveis-templates-whatsapp-faixa-1) — já preparado.
Leia primeiro: .spec/features/cards-expansiveis-templates-whatsapp/spec.md, .spec/features/cards-expansiveis-templates-whatsapp/tasks.md e .spec/constituicao.md.

Execute NESTA ORDEM (1 tarefa = 1 commit):
T-156 — "Implementar accordion e cards expansíveis individuais no Frontend"
  critérios/refs: AC-230 (Expansão e recolhimento individual dos cards de template)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx, frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx
  mensagem de commit: "T-156 cards-expansiveis-templates-whatsapp: Implementar accordion e cards expansíveis individuais no Frontend"
T-157 — "Exibir prévia contextual em tempo real dentro de cada card expandido"
  critérios/refs: AC-231 (Exibição de prévia simulada contextual dentro do card expandido)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx, frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx
  mensagem de commit: "T-157 cards-expansiveis-templates-whatsapp: Exibir prévia contextual em tempo real dentro de cada card expandido"
T-158 — "Implementar botão de salvar individual com feedback visual por card"
  critérios/refs: AC-232 (Botão de salvar individual por card de mensagem)
  arquivos permitidos (e seus testes): frontend/src/features/whatsapp/components/WhatsappTemplatesDrawer.tsx, frontend/src/features/whatsapp/__tests__/WhatsappTemplatesDrawer.spec.tsx
  mensagem de commit: "T-158 cards-expansiveis-templates-whatsapp: Implementar botão de salvar individual com feedback visual por card"

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
git merge --no-ff spec/cards-expansiveis-templates-whatsapp-faixa-1 -m "merge faixa-1 (cards-expansiveis-templates-whatsapp)"
git worktree remove ../onp-worktrees/App-Agenda-Consultório-cards-expansiveis-templates-whatsapp-faixa-1 && git branch -d spec/cards-expansiveis-templates-whatsapp-faixa-1
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa cards-expansiveis-templates-whatsapp T-156 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa cards-expansiveis-templates-whatsapp T-157 concluida
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa cards-expansiveis-templates-whatsapp T-158 concluida
```

5. **Gate final** (exit 0 ou não está pronto):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify cards-expansiveis-templates-whatsapp
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
```

6. **Acompanhamento (a cada ~1 min, enquanto os agentes trabalham)**: avise ANTES
   de despachar os agentes que o trabalho roda em background e que o resumo
   completo vem ao final. Marque cada tarefa no ledger quando um agente começa
   e quando termina (é disso que a tabela é feita):

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-cards-expansiveis-templates-whatsapp-mvr3rliz --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado executando
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs evento --run App-Agenda-Consultório-cards-expansiveis-templates-whatsapp-mvr3rliz --tipo tarefa --tarefa <T-xxx> --faixa <faixa-N> --estado concluida
```

   E a cada ~1 min poste no chat a TABELA de andamento + um parágrafo curto,
   registrando o texto no ledger:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo cards-expansiveis-templates-whatsapp --tabela   # a tabela — cole no chat
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs resumo cards-expansiveis-templates-whatsapp --gravar --origem ia --texto "<2 a 4 frases do que está rolando>"
```

