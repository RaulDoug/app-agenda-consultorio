# Regras Mandatórias do Frontend — OdontoFlow

Ao atuar no diretório `frontend/`, o agente de IA e os desenvolvedores DEVEM OBRIGATORIAMENTE:
1. **Consultar Sempre `docs/frontend/funcionalidades/regras_globais.md`:** Seguir as regras de:
   - Arquitetura estrita em 4 camadas: UI/Components ➔ Feature Hooks/State ➔ Local Repositories (Dexie.js) ➔ Sync/API Client;
   - Persistência Local-First mandatória (todas as mutações passam por transação Dexie + `sync_outbox`);
   - Reatividade instantânea com `useLiveQuery` (leituras do banco local em < 5ms);
   - Princípios de UX Mobile e One-Thumb Ergonomics (gavetas inferiores, safe-areas, botões de ação acessíveis ao polegar);
   - Testes unitários com Vitest, React Testing Library e `fake-indexeddb`.
2. **Consultar a Pasta `docs/frontend/funcionalidades/`:** Verificar a documentação da funcionalidade específica antes de iniciar alterações.
3. **Atualização da Documentação:** A cada tarefa concluída, atualizar `regras_globais.md` e criar/atualizar o arquivo `.md` correspondente na pasta de funcionalidades do frontend.
4. **Respeitar `frontend/AGENTS.md`:** Seguir as diretrizes locais da pasta do frontend.
