# Diretrizes e Regras Estritas do Backend — OdontoFlow

> **Escopo:** Todo o código dentro de `backend/` e seus subdiretórios.  
> **Status:** Regra Mandatória Inegociável para Agentes de IA e Desenvolvedores.

---

## 1. Regra Mandatória de Consulta e Atualização de Documentação

### 1.1 Consulta Obrigatória Prévia
Antes de iniciar qualquer análise, planejamento, refatoração ou implementação de código no backend:
- A IA **DEVE OBRIGATORIAMENTE** ler e consultar a pasta [`docs/backend/funcionalidades`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/docs/backend/funcionalidades).
- A leitura do arquivo [`regras_globais.md`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/docs/backend/funcionalidades/regras_globais.md) é mandatória para garantir conformidade com as regras transversais.

### 1.2 Atualização Mandatória a Cada Tarefa Finalizada (Gate de Conclusão)
Nenhuma tarefa no backend é considerada concluída sem que a documentação técnica seja atualizada:
1. **Documentação da Funcionalidade:** Gerar ou atualizar o arquivo específico em `docs/backend/funcionalidades/<nome_da_funcionalidade>.md` detalhando com clareza e concisão:
   - O que a funcionalidade faz e suas regras de negócio aplicadas.
   - Entradas, saídas e comportamentos de erro esperados.
   - Padrões adotados para servir de base às próximas etapas da IA.
2. **Atualização das Regras Globais:** Sempre que uma nova regra de negócio transversal, convenção de persistência ou padrão de código for criado ou ajustado, o arquivo [`regras_globais.md`](file:///c:/Users/User/Desktop/Projetos/App-Agenda-Consultório/docs/backend/funcionalidades/regras_globais.md) **DEVE ser imediatamente atualizado**.

---

## 2. Arquitetura Rígida em 4 Camadas

Todo o código de backend deve respeitar rigorosamente a separação em quatro camadas isoladas:

```
Routes ──► Controllers ──► Services ──► Repositories
```

1. **`backend/src/routes/` (Rotas HTTP):**
   - Responsabilidade exclusiva de registrar endpoints, métodos HTTP (GET, POST, PUT, DELETE) e aplicar middlewares (ex.: `authMiddleware`).
   - **Proibição:** Não deve conter lógica de negócio, não deve manipular banco de dados e não deve executar regras diretamente. Encaminha o fluxo diretamente ao Controller correspondente.

2. **`backend/src/controllers/` (Controladores HTTP):**
   - Responsabilidade exclusiva de lidar com a camada HTTP: extrair parâmetros (`req.params`, `req.query`, `req.body`, `req.tenantId`), chamar o método do Service correspondente e responder ao cliente com o status code correto (`200`, `201`, `400`, `404`, `500`).
   - **Proibição:** Não executa queries SQL e não implementa regras de negócio pesadas.

3. **`backend/src/services/` (Regras de Negócio):**
   - Coração da aplicação. Contém todas as regras de negócio, validações de domínio (conflitos de horários, limites, cálculos, consistência) e orquestração de múltiplos repositórios ou serviços externos (BullMQ, Evolution API).
   - **Proibição:** É 100% desacoplado do Express. Não deve receber nem referenciar objetos `req` ou `res`.

4. **`backend/src/repositories/` (Acesso a Dados / Persistência):**
   - Responsabilidade exclusiva de executar operações no banco PostgreSQL via driver `pg`.
   - **Proibição:** Não toma decisões de negócio de alto nível e não conhece contexto HTTP.

---

## 3. Estratégia Estrita de Testes Unitários por Camada

Cada funcionalidade desenvolvida ou refatorada deve conter testes unitários isolados para cada uma de suas camadas:

1. **Repositórios (`*.repository.spec.ts`):**
   - Testar comandos SQL, cláusula `tenant_id`, soft-delete (`deleted_at IS NULL`) e paginação usando banco de testes ou `pg-mem`.
2. **Services (`*.service.spec.ts`):**
   - Testar todas as regras de negócio, fluxos alternativos e lançamento de erros de domínio isoladamente, utilizando **mocks** dos repositórios.
3. **Controllers (`*.controller.spec.ts`):**
   - Testar extração de dados HTTP, mapeamento de códigos de status (200, 201, 400, 404, etc.) e respostas JSON, utilizando **mocks** dos services.
4. **Rotas / Integração (`*.routes.spec.ts`):**
   - Testar endpoints via `supertest` garantindo funcionamento de middlewares de autenticação e contratos de API.

---

## 4. Regras de Segurança e Persistência de Dados

1. **Isolamento Multi-Tenant Inegociável:**
   - O identificador `tenantId` deve vir sempre do token JWT autenticado (`req.tenantId`).
   - Toda consulta no banco DEVE filtrar `tenant_id = $x`.
   - Consultas por identificador único DEVEM ser compostas: `WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`.
2. **Soft-Delete Mandatório:**
   - É terminantemente proibido o uso de `DELETE FROM <table>` para entidades de negócio.
   - A exclusão deve sempre ser lógica:
     ```sql
     UPDATE <tabela>
     SET is_active = false, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL;
     ```
   - Consultas operacionais padrão devem incluir `AND deleted_at IS NULL`.
3. **Parametrização Estrita de SQL:**
   - Toda query deve utilizar parâmetros posicionais (`$1, $2, ...`) para prevenir *SQL Injection*.
