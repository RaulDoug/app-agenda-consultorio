# Diretrizes do Projeto — Uso Mandatório da Skill onp-spec-driven

## Regra de Desenvolvimento Fundamental
O desenvolvimento neste repositório segue estritamente a metodologia **Spec-Driven & Test-Anchored** implementada pela skill `onp-spec-driven` (localizada em `.agents/skills/onp-spec-driven`).

> **REGRA MANDATÓRIA:**
> O uso da skill `onp-spec-driven` **deve ser sempre feito** para qualquer planejamento, especificação de requisitos, criação de tarefas, implementação e auditoria de código neste projeto.
>
> **Única exceção:** Casos em que o usuário solicitar explicitamente o não uso desta skill.

---

## Ciclo de Desenvolvimento Obrigatório

Toda nova funcionalidade ou alteração deve seguir as fases do motor spec-driven:

```
┌───────────┐  ┌────────┐  ┌───────┐  ┌───────┐  ┌────────┐  ┌───────┐
│ESPECIFICAR│→ │PROJETAR│→ │TAREFAS│→ │ PLANO │→ │EXECUTAR│→ │AUDITAR│
└───────────┘  └────────┘  └───────┘  └───────┐  └────────┘  └───────┘
```

1. **Especificar (`onp-spec new <feature>`)**:
   - Criar a especificação com histórias de usuário (`US-xxx`), critérios de aceite (`AC-xxx`), suposições (`ASM-xxx`) e perguntas em aberto (`Q-xxx`).
2. **Projetar & Tarefas**:
   - Definir a decomposição em tarefas (`T-xxx`) mapeadas para os critérios de aceite em `.spec/features/<feature>/tasks.md`.
3. **Plano de Execução (`onp-spec plano <feature>`)**:
   - Perguntar ao usuário quais tarefas paralelizar ou se deseja execução sequencial antes de iniciar.
4. **Executar (TDD com Prova Mecânica)**:
   - Todo critério de aceite deve possuir teste associado anotado com `@spec:AC-xxx` no título (`onp-spec scaffold <feature>`).
   - Implementação guiada por testes (Red-Green-Refactor).
   - Execução dos testes e gravação da prova: `onp-spec verify <feature>`.
5. **Auditar (`onp-spec audit --ci`)**:
   - **Gate Inegociável**: Nenhuma tarefa ou feature é considerada pronta sem o veredito mecânico do audit saindo com código 0.
6. **Aprender (`onp-spec licoes`)**:
   - Registrar lições com lastro mecânico ao concluir ciclos.

---

## Invocação do Motor Embarcado

Os comandos são executados a partir da raiz do projeto:
```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs <comando>
```
Comandos principais: `status`, `new <feature>`, `scaffold <feature>`, `verify <feature>`, `audit [--ci]`, `plano <feature>`, `licoes`.

---

## Estrutura do Monorepo e Documentação de Referência

Este repositório está estruturado como um **Monorepo TypeScript (NPM Workspaces)**:

- `shared/` (`@cliniassist/shared`): Contratos, interfaces TypeScript, Enums e tipos compartilhados entre Frontend e Backend.
- `backend/`: API REST em Node.js + TypeScript + Express.js + PostgreSQL (`pg` com SQL puro) + BullMQ/Redis + Evolution API.
- `frontend/`: Aplicação Web Mobile-First (PWA) em React + TypeScript + Vite + Tailwind CSS + Dexie.js (IndexedDB Offline-First).
- `docs/`: Documentação completa de produto, arquitetura e roadmaps de TDD:
  - `docs/01_PRD_Geral_OdontoFlow.md` — Visão de produto, personas, épicos e regras de negócio.
  - `docs/backend/Arquitetura_Backend.md` — Arquitetura técnica do servidor, SQL Schema completo, filas e webhooks.
  - `docs/backend/Roadmap_TDD_Backend.md` — Sprints, casos de teste prévios e edge cases exclusivos do Backend.
  - `docs/frontend/Arquitetura_e_UX_Frontend.md` — Arquitetura Local-First, sincronização offline e wireframes das telas mobile.
  - `docs/frontend/Roadmap_TDD_Frontend.md` — Sprints, casos de teste UI/IndexedDB e E2E exclusivos do Frontend.

---

## Diretrizes Mandatórias de Backend e Consulta de Documentação

Ao atuar no diretório `backend/`, o agente de IA e os desenvolvedores DEVEM OBRIGATORIAMENTE:
1. **Consultar Sempre `docs/backend/funcionalidades/regras_globais.md`:** Todas as decisões de arquitetura e código devem seguir estritamente as regras globais (Soft-Delete, Isolamento Multi-Tenant, Arquitetura em 4 Camadas, Testes Unitários e Segurança de Identidade/Bcrypt).
2. **Consultar a Pasta `docs/backend/funcionalidades/`:** Antes de alterar ou criar qualquer módulo no backend, consultar os arquivos de documentação específicos da funcionalidade correspondente para entender regras vigentes, contratos e dependências.
3. **Atualização Contínua da Documentação:** A cada tarefa ou ajuste finalizado no backend:
   - Atualizar `docs/backend/funcionalidades/regras_globais.md` com eventuais novas regras;
   - Criar ou atualizar o arquivo `.md` correspondente na pasta `docs/backend/funcionalidades/` com explicação detalhada mas concisa para consulta de futuras sessões e IAs.
4. **Respeitar `backend/AGENTS.md`:** Seguir as diretrizes locais da pasta do backend.

---

## Diretrizes Mandatórias de Frontend e Consulta de Documentação

Ao atuar no diretório `frontend/`, o agente de IA e os desenvolvedores DEVEM OBRIGATORIAMENTE:
1. **Consultar Sempre `docs/frontend/funcionalidades/regras_globais.md`:** Todas as decisões de arquitetura e código devem seguir estritamente as regras globais de frontend (Arquitetura em 4 Camadas, Paradigma Local-First, Reatividade com `useLiveQuery`, Fila `sync_outbox`, One-Thumb Ergonomics e Testes Unitários com `fake-indexeddb`).
2. **Consultar a Pasta `docs/frontend/funcionalidades/`:** Antes de alterar ou criar qualquer componente, hook ou fluxo no frontend, consultar os arquivos de documentação específicos da funcionalidade correspondente para entender comportamento de tela, regras de interação e dependências.
3. **Atualização Contínua da Documentação:** A cada tarefa ou ajuste finalizado no frontend:
   - Atualizar `docs/frontend/funcionalidades/regras_globais.md` com eventuais novas regras e padrões de UI/UX;
   - Criar ou atualizar o arquivo `.md` correspondente na pasta `docs/frontend/funcionalidades/` com explicação clara e concisa para consulta de futuras sessões e IAs.
4. **Respeitar `frontend/AGENTS.md` e `.agents/rules/frontend-regras.md`:** Seguir as diretrizes locais da pasta do frontend.

