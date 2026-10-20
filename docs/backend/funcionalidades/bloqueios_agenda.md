# Módulo: Bloqueios de Agenda (`schedule_blocks`) — OdontoFlow Backend

> **Status:** Concluído e Testado  
> **Localização:** `docs/backend/funcionalidades/bloqueios_agenda.md`  
> **Arquitetura:** 4 Camadas (`routes/schedule-blocks.ts` ➔ `schedule-block-controller.ts` ➔ `schedule-block-service.ts` ➔ `schedule-block-repository.ts`)

---

## 1. Visão Geral
Permite definir intervalos de tempo em que a agenda da clínica está bloqueada para novos atendimentos normais (ex.: reuniões internas, reformas, congressos, feriados ou ausências profissionais). Suporta CRUD completo com Soft-Delete.

---

## 2. Regras de Negócio e Validações
1. **Autenticação e Multi-Tenancy:**
   - Todas as rotas são protegidas via `authMiddleware` com validação de `tenant_id`. Bloqueios de um consultório nunca são visíveis ou editáveis por outro.
2. **Campos Obrigatórios:**
   - `title`: Descrição do bloqueio (não vazia). É este título que será apresentado ao usuário caso ele tente agendar nesse horário.
   - `start_time` e `end_time`: Datas e horários no formato ISO 8601 UTC.
   - A data/hora de término deve ser estritamente posterior ao início (`end_time > start_time`).
3. **Detecção de Conflitos e Integração com Agendamentos:**
   - O método `ScheduleBlockService.checkBlockConflict(tenantId, startIso, endIso)` utiliza a query `findOverlapping` com fórmula `(block.start_time < slot_end AND block.end_time > slot_start)`.
   - Se houver bloqueio e o agendamento não tiver `confirm_overtime: true`, a API devolve erro estruturado HTTP 409 informando `block_title` e mensagem detalhada.
4. **Soft-Delete:**
   - Exclusão via `DELETE /api/schedule-blocks/:id` atualiza `deleted_at = CURRENT_TIMESTAMP`, preservando histórico contábil e de auditoria.

---

## 3. Endpoints da API

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
|---|---|---|---|---|
| `GET` | `/api/schedule-blocks` | Lista bloqueios ativos com filtros opcionais `?startDate=&endDate=` | `200 OK` | `401 Unauthorized` |
| `GET` | `/api/schedule-blocks/:id` | Busca bloqueio por ID | `200 OK` | `401`, `404 Not Found` |
| `POST` | `/api/schedule-blocks` | Cria novo bloqueio de agenda | `201 Created` | `400 Bad Request`, `401` |
| `PUT` | `/api/schedule-blocks/:id` | Atualiza título ou intervalo do bloqueio | `200 OK` | `400`, `401`, `404` |
| `DELETE`| `/api/schedule-blocks/:id` | Remove bloqueio via Soft-Delete | `200 OK` | `401`, `404` |

---

## 4. Testes Automatizados
- **Repositório:** `src/repositories/__tests__/schedule-block-repository.spec.ts` (CRUD, soft-delete e detecção de sobreposição).
- **Service:** `src/services/__tests__/schedule-block-service.spec.ts` (validação de datas e retorno do título no conflito).
- **Controller:** `src/controllers/__tests__/schedule-block-controller.spec.ts` (HTTP status codes e extração).
- **Rotas:** `src/routes/__tests__/schedule-blocks.routes.spec.ts` (integração via Supertest).
