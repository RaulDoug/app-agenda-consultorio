# Gestão de Pacientes e Clientes — Backend (OdontoFlow)

> **Documento:** `docs/backend/funcionalidades/cadastro_clientes.md`  
> **Status:** Ativo / Implementado  
> **Camada:** Backend (Repositório, Serviço, Rotas e Sincronização)

---

## 1. Visão Geral

A gestão de pacientes no backend do **OdontoFlow** provê persistência relacional com PostgreSQL, isolamento estrito multi-tenant por `tenant_id`, soft-delete mandatório, suporte a reativação de clientes inativos e sincronização bidirecional via endpoint `/api/sync/batch`.

---

## 2. Repositório de Pacientes (`PatientRepository`)

- **Soft-Delete e Consultas com Inativos:**
  - O método `findAll(tenantId, options)` adota por padrão a restrição `is_active = true AND deleted_at IS NULL`.
  - Quando a opção `includeInactive: true` é informada, a query remove a cláusula `deleted_at IS NULL`, permitindo listar toda a base histórica (ativos e inativos).
- **Restauração e Reativação:**
  - O método `update(tenantId, id, data)` opera sobre `WHERE id = $1 AND tenant_id = $2` sem a trava `deleted_at IS NULL`, permitindo restaurar registros inativados logicamente.
  - Ao receber `data.is_active = true`, adiciona explicitamente `deleted_at = NULL` ao comando SQL.
  - O método `findById(tenantId, id, options)` suporta `options.includeInactive` para recuperar cadastros inativos.

---

## 3. Regras de Negócio e Validações (`PatientService`)

- **Salvaguarda de Duplicidade de WhatsApp:**
  - `findByWhatsapp` pesquisa apenas pacientes ativos (`is_active = true AND deleted_at IS NULL`).
  - Ao criar um paciente (`createPatient`), impede duplicação entre ativos.
  - Ao atualizar ou reativar um paciente (`updatePatient`), valida se outro paciente ativo já possui o mesmo número normalizado no mesmo consultório, lançando `HTTP 409 Conflict` se houver colisão.
- **Sincronização Bidirecional (`sync.ts`):**
  - O endpoint de batch sync suporta mutações `UPDATE` contendo `is_active: true` e `deleted_at: null`, aplicando resolução *Last-Write-Wins* (LWW) baseada em `updated_at`.

