# Módulo: Procedimentos e Serviços — OdontoFlow Backend

> **Status:** Concluído e Testado  
> **Localização:** `docs/backend/funcionalidades/procedimentos_servicos.md`  
> **Arquitetura:** 4 Camadas (`routes/procedures.ts` ➔ `procedure-controller.ts` ➔ `procedure-service.ts` ➔ `procedure-repository.ts`)

---

## 1. Visão Geral
Gerencia o catálogo de procedimentos e serviços clínicos do consultório, permitindo cadastrar, editar, pesquisar e excluir logicamente. Cada procedimento possui duração padrão em minutos, valor cobrado ao paciente (`default_price_cents`) e custo operacional de realização (`cost_cents`).

---

## 2. Regras de Negócio e Validações
1. **Autenticação e Multi-Tenancy:**
   - Todas as rotas exigem token JWT válido (`authMiddleware`).
   - O `tenant_id` é extraído de `req.tenantId` assinado. Procedimentos de um consultório são 100% isolados de outros.
2. **Auto-Seed de Procedimentos Padrões:**
   - Na primeira consulta de um novo tenant (`GET /api/procedures` ou no lote `POST /api/sync/batch`), se o tenant não possuir procedimentos cadastrados, o backend semeia automaticamente os 4 procedimentos padrões da clínica com durações, preços e custos de insumos pré-definidos (`ensureDefaultProcedures`).
3. **Preço Cobrado vs. Custo de Realização:**
   - `default_price_cents`: Valor cobrado do paciente em centavos. Deve ser `>= 0` (permite R$ 0,00 para procedimentos cortesia/avaliação).
   - `cost_cents`: Custo de insumos e realização em centavos. Deve ser `>= 0`. Default `0` caso não informado.
   - `default_duration_minutes`: Tempo estimado de atendimento. Deve ser `> 0`.
4. **Busca Textual e Filtro de Inativos:**
   - O endpoint `GET /api/procedures?search=termo` realiza busca case-insensitive no nome do procedimento.
   - O parâmetro `?includeInactive=true` permite retornar tanto os procedimentos ativos quanto os soft-deleted.
5. **Soft-Delete Inegociável e Reativação:**
   - A exclusão via `DELETE /api/procedures/:id` realiza soft-delete (`is_active = false, deleted_at = CURRENT_TIMESTAMP`), garantindo que agendamentos e transações passadas não quebrem a integridade histórica.
   - A reativação é permitida via `PUT /api/procedures/:id` com `{ is_active: true }`, o que redefine `deleted_at = NULL` e reativa o procedimento para novos atendimentos.

---

## 3. Endpoints da API

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
|---|---|---|---|---|
| `GET` | `/api/procedures` | Lista procedimentos com suporte a `?search=`, `?includeInactive=` e auto-seed | `200 OK` | `401 Unauthorized` |
| `GET` | `/api/procedures/:id` | Busca procedimento por ID garantindo tenant | `200 OK` | `401`, `404 Not Found` |
| `POST` | `/api/procedures` | Cadastra novo procedimento com preço e custo | `201 Created` | `400 Bad Request`, `401` |
| `PUT` | `/api/procedures/:id` | Atualiza ou reativa procedimento (nome, duração, preço, custo, is_active) | `200 OK` | `400`, `401`, `404` |
| `DELETE`| `/api/procedures/:id` | Desativa procedimento (Soft-Delete) | `200 OK` | `401`, `404` |

---

## 4. Testes Automatizados
- **Repositório:** `src/repositories/__tests__/procedure-repository.spec.ts` (persistência, cost_cents, multi-tenant, soft-delete, `@spec:AC-245` auto-seed no PostgreSQL e reativação).
- **Service:** `src/services/__tests__/procedure-service.spec.ts` (validações de duração positiva, preço e custo não-negativos).
- **Controller:** `src/controllers/__tests__/procedure-controller.spec.ts` (extração HTTP e códigos 200/201/400/404).
- **Rotas:** `src/routes/__tests__/procedures.routes.spec.ts` (integração ponta a ponta com Supertest).
