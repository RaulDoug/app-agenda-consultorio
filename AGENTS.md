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
