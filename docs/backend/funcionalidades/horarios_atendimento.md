# Módulo: Horários de Atendimento (Expediente) — OdontoFlow Backend

> **Status:** Concluído e Testado  
> **Localização:** `docs/backend/funcionalidades/horarios_atendimento.md`  
> **Arquitetura:** 4 Camadas (`routes/business-hours.ts` ➔ `business-hours-controller.ts` ➔ `business-hours-service.ts` ➔ `business-hours-repository.ts`)

---

## 1. Visão Geral
Gerencia os horários de funcionamento do consultório para cada um dos 7 dias da semana (0 = Domingo a 6 = Sábado), definindo início e término do expediente, intervalo de almoço e se o consultório está aberto ou fechado no dia (`is_open`). É a base canônica para calcular os horários disponíveis de agendamento.

---

## 2. Regras de Negócio e Validações
1. **Sem Suporte a Exclusão (Regra de Negócio Mandatória):**
   - A tabela `business_hours` **NÃO possui rota ou método de exclusão** (física ou lógica).
   - O consultório apenas consulta e edita os horários ou marca o dia como fechado (`is_open = false`).
2. **Validações Temporais Rígidas:**
   - `day_of_week`: Inteiro entre `0` e `6`.
   - Se `is_open = true`:
     - `start_time` e `end_time` são obrigatórios (formato `HH:mm`).
     - O horário de término deve ser estritamente posterior ao horário de início (`end_time > start_time`).
     - Caso haja intervalo de almoço (`break_start_time` e `break_end_time`):
       - O término do almoço deve ser posterior ao início (`break_end_time > break_start_time`).
       - O intervalo deve estar contido integralmente dentro do expediente (`break_start_time >= start_time` e `break_end_time <= end_time`).
3. **Consistência de Disponibilidade:**
   - O método `BusinessHoursService.checkSlotAvailability(tenantId, start, end)` verifica se um agendamento desejado colide com o horário de fechamento (`OUTSIDE_HOURS`) ou com o intervalo de almoço (`BREAK_TIME`).
   - Se o consultório ainda não tiver configurado horários personalizados, aplica o fallback padrão seguro (Segunda a Sexta 08:00–18:00 com almoço 12:00–13:30; Sábado e Domingo fechados).

---

## 3. Endpoints da API

| Método | Endpoint | Descrição | Status Sucesso | Status Erros |
|---|---|---|---|---|
| `GET` | `/api/business-hours` | Lista os horários configurados do consultório | `200 OK` | `401 Unauthorized` |
| `PUT` | `/api/business-hours` | Atualiza um dia ou lote de dias do expediente | `200 OK` | `400 Bad Request`, `401` |

---

## 4. Testes Automatizados
- **Repositório:** `src/repositories/__tests__/business-hours-repository.spec.ts` (persistência, upsert de dias e ausência de método delete).
- **Service:** `src/services/__tests__/business-hours-service.spec.ts` (validações de horário de almoço e colisão de expediente).
- **Controller:** `src/controllers/__tests__/business-hours-controller.spec.ts` (extração HTTP e status 200/400).
- **Rotas:** `src/routes/__tests__/business-hours.routes.spec.ts` (integração via Supertest).
