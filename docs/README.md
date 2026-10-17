# Documentação Oficial — OdontoFlow Monorepo

Bem-vindo à documentação central do **OdontoFlow**. Toda a especificação foi estruturada e separada por contexto (**Geral**, **Back-end** e **Front-end**) para otimizar tanto a leitura humana quanto o consumo de contexto por agentes de IA durante o desenvolvimento guiado por especificações (`onp-spec-driven`) e TDD.

---

## Mapa de Documentos

### 1. Visão Geral e Produto
* 📄 **[01_PRD_Geral_OdontoFlow.md](./01_PRD_Geral_OdontoFlow.md)**  
  Visão de negócio, persona do *Dentista-Operador*, requisitos não-funcionais, épicos e histórias de usuário (`US1.1` a `US4.4`) e diagrama conceitual de entidades.
* 📄 **[historico-alinhamento-po.md](./historico-alinhamento-po.md)**  
  Memória de contexto completa da sessão de concepção/alinhamento com os POs (decisões tomadas, alternativas rejeitadas e justificativas).

### 2. Back-end (`back-end/`)
* 📄 **[backend/Arquitetura_Backend.md](./backend/Arquitetura_Backend.md)**  
  Stack do servidor (Node.js + TypeScript + Express.js + `pg` SQL puro), dimensionamento da VPS Hostinger via Docker Compose, pipeline de Webhooks da Evolution API + fila anti-ban BullMQ/Redis e script DDL completo das 8 tabelas do PostgreSQL.
* 📄 **[backend/Roadmap_TDD_Backend.md](./backend/Roadmap_TDD_Backend.md)**  
  Planejamento das 5 Sprints do Back-end (`BE-1` a `BE-5`), listando todos os testes unitários, testes de integração SQL/API e *edge cases* que devem ser escritos antes da implementação.

### 3. Front-end (`front-end/`)
* 📄 **[frontend/Arquitetura_e_UX_Frontend.md](./frontend/Arquitetura_e_UX_Frontend.md)**  
  Arquitetura *Local-First / Offline-First* (React + Vite PWA + Tailwind CSS + `Dexie.js`/IndexedDB + Fila `sync_outbox`), princípios de ergonomia *One-Thumb* e wireframes detalhados das 5 telas principais.
* 📄 **[frontend/Roadmap_TDD_Frontend.md](./frontend/Roadmap_TDD_Frontend.md)**  
  Planejamento das 4 Sprints do Front-end (`FE-1` a `FE-4`), detalhando os testes da camada local (`fake-indexeddb`), testes de interface (`React Testing Library`), *edge cases* visuais e suíte E2E mobile (`Playwright`).
