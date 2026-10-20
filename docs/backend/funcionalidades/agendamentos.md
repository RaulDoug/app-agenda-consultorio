# Funcionalidade: Agendamentos de Consultas

## 1. Visão Geral e Responsabilidades
O módulo de Agendamentos gerencia o fluxo de agendamento de consultas da clínica, garantindo a integridade temporal da agenda através de verificação tripla de conflitos, suporte a múltiplos procedimentos por agendamento com soma de duração, rateio de descontos, mecanismo de encaixe extraordinário e estorno contábil automático.

## 2. Arquitetura em 4 Camadas
- **Rota (`backend/src/routes/appointments.ts`):** Protegida por `authMiddleware`, delega requisições HTTP aos métodos do controller.
- **Controller (`backend/src/controllers/appointment-controller.ts`):** Valida payload de entrada e mapeia exceções de conflito (`AppointmentConflictError`) para status HTTP 409 com corpo estruturado (`code`, `block_title`, `error`).
- **Service (`backend/src/services/appointment-service.ts`):** Executa regras de negócio:
  - Validação tripla de disponibilidade quando `confirm_overtime: false` (Bloqueios de Agenda, Horário de Expediente/Almoço e Double Booking).
  - Cálculo de duração agregada somando `default_duration_minutes` de todos os procedimentos selecionados.
  - Distribuição ponderada de descontos (R$ ou %) através do algoritmo de rateio centavo a centavo (`calculateDiscountDistribution`), inclusive com valor final zerado (R$ 0,00).
  - Estorno contábil automático (D-09): no cancelamento ou exclusão de consulta que já estava concluída (`COMPLETED`), todas as transações financeiras vinculadas em `financial_transactions` sofrem soft-delete automático.
- **Repository (`backend/src/repositories/appointment-repository.ts`):** Executa queries SQL parametrizadas isoladas por `tenant_id`, inserindo atomicamente o agendamento e seus itens (`appointment_items`) em transação de banco.

## 3. Regras de Negócio e Decisões (/grill-me)
1. **Validação Tripla de Conflitos e HTTP 409 Estruturado (D-01):**
   - **Bloqueio de Agenda:** Retorna `{ code: 'SCHEDULE_BLOCK', block_title: '...', error: '...' }`.
   - **Fora do Expediente:** Retorna `{ code: 'OUTSIDE_HOURS', error: '...' }`.
   - **Intervalo de Almoço:** Retorna `{ code: 'BREAK_TIME', error: '...' }`.
   - **Double Booking:** Retorna `{ code: 'DOUBLE_BOOKING', error: '...' }`.
2. **Encaixe Extraordinário:**
   - Quando `confirm_overtime: true`, a validação de conflitos é ignorada e o agendamento é persistido com a flag `is_overtime = true`.
3. **Múltiplos Procedimentos e Rateio de Descontos (D-02):**
   - Agendamento soma durações e preços de tabela. Descontos em valor fixo ou porcentagem são rateados proporcionalmente entre os itens.
4. **Estorno Contábil Automático (D-09):**
   - Ao cancelar (`status = 'CANCELLED'`) ou deletar (soft-delete) um agendamento com status `COMPLETED`, transações ativas vinculadas a este agendamento são desativadas (`is_active = false, deleted_at = CURRENT_TIMESTAMP`), garantindo que o caixa e contas a receber não fiquem inflados indevidamente.
