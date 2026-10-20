# Regras Mandatórias do Backend — OdontoFlow

Ao atuar no diretório `backend/`, o agente de IA e os desenvolvedores DEVEM OBRIGATORIAMENTE:
1. **Consultar Sempre `docs/backend/funcionalidades/regras_globais.md`:** Seguir as regras de:
   - Soft-delete mandatório (`deleted_at`, sem `DELETE FROM`);
   - Isolamento multi-tenant estrito via JWT assinado com `token_version` (sem bypass de `x-tenant-id`);
   - Arquitetura estrita em 4 camadas: Routes ➔ Controllers ➔ Services ➔ Repositories;
   - Testes unitários focados para cada camada;
   - Criptografia com bcrypt (10 rounds) e proteção contra força bruta.
2. **Consultar a Pasta `docs/backend/funcionalidades/`:** Verificar a documentação da funcionalidade específica antes de iniciar alterações.
3. **Atualização da Documentação:** A cada tarefa concluída, atualizar `regras_globais.md` e criar/atualizar o arquivo `.md` correspondente na pasta de funcionalidades.
4. **Respeitar `backend/AGENTS.md`:** Seguir as diretrizes locais da pasta do backend.
