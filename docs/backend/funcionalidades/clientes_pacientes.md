# Módulo: Clientes (Pacientes) — OdontoFlow Backend

> **Status:** Concluído e Testado  
> **Localização:** `docs/backend/funcionalidades/clientes_pacientes.md`  
> **Arquitetura:** 4 Camadas (`routes/patients.ts` ➔ `patient-controller.ts` ➔ `patient-service.ts` ➔ `patient-repository.ts`)

---

## 1. Visão Geral
Gerencia o cadastro, edição, listagem com busca textual e exclusão lógica (soft-delete) de pacientes do consultório, garantindo autenticação obrigatória via JWT e isolamento multi-tenant estrito por `tenant_id`.

---

## 2. Regras de Negócio e Validações
1. **Autenticação e Multi-Tenancy:**
   - Todas as rotas exigem token JWT válido (`authMiddleware`).
   - O `tenant_id` é extraído estritamente de `req.tenantId` assinado, nunca do corpo ou da URL.
2. **Campos Obrigatórios:**
   - `name`: String não vazia (aplica-se trim). Retorna HTTP 400 se ausente ou em branco.
   - `whatsapp`: String não vazia (aplica-se trim). Retorna HTTP 400 se ausente ou em branco.
   - `notes`: Texto opcional para prontuário/histórico.
3. **Busca Textual:**
   - O endpoint `GET /api/patients?search=termo` realiza busca case-insensitive (`ILIKE`) tanto no nome quanto no número de WhatsApp do paciente.
4. **Soft-Delete Inegociável:**
   - A exclusão via `DELETE /api/patients/:id` nunca executa `DELETE FROM`.
   - Atualiza `is_active = false`, `deleted_at = CURRENT_TIMESTAMP` e `updated_at = CURRENT_TIMESTAMP`.
   - Buscas normais filtram `AND deleted_at IS NULL`.

---

## 3. Endpoints da API

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
|---|---|---|---|---|
| `GET` | `/api/patients` | Lista pacientes com suporte a `?search=` e `?includeInactive=` | `200 OK` | `401 Unauthorized` |
| `GET` | `/api/patients/:id` | Busca paciente por ID garantindo tenant | `200 OK` | `401`, `404 Not Found` |
| `POST` | `/api/patients` | Cadastra novo paciente | `201 Created` | `400 Bad Request`, `401` |
| `PUT` | `/api/patients/:id` | Atualiza dados do paciente | `200 OK` | `400`, `401`, `404` |
| `DELETE`| `/api/patients/:id` | Desativa paciente (Soft-Delete) | `200 OK` | `401`, `404` |

---

## 4. Testes Automatizados
- **Repositório:** `src/repositories/__tests__/patient-repository.spec.ts` (persistência, multi-tenant e soft-delete).
- **Service:** `src/services/__tests__/patient-service.spec.ts` (validações de domínio com mocks).
- **Controller:** `src/controllers/__tests__/patient-controller.spec.ts` (extração HTTP e status codes com mocks).
- **Rotas:** `src/routes/__tests__/patients.routes.spec.ts` (integração ponta a ponta com Supertest).
