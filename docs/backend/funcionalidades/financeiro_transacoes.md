# Funcionalidade: Transações Financeiras e Métricas em Regime de Caixa

## 1. Visão Geral e Responsabilidades
O módulo financeiro do OdontoFlow é responsável pelo controle completo do fluxo de caixa e gestão contábil da clínica odontológica, englobando checkout de atendimentos com múltiplos procedimentos e rateio ponderado de descontos, gestão de parcelamentos e despesas recorrentes com agrupamento (`group_id`), quitação em lote de parcelas, categorização customizada por tenant e relatórios analíticos em **Regime de Caixa**.

## 2. Arquitetura em 4 Camadas
- **Rotas (`backend/src/routes/financial.ts`):** Protegidas por `authMiddleware`, expõem os endpoints de categorias (`/categories`), despesas (`/expenses`), checkout (`/checkout`), edição e quitação de parcelas (`/transactions/:id`, `/settle-batch`) e métricas analíticas (`/metrics`).
- **Controllers (`financial-controller.ts`, `financial-category-controller.ts`):** Mapeiam entradas HTTP, tipagem e convertem erros em respostas estruturadas (e.g. HTTP 400 com código `LINKED_COMPLETED_APPOINTMENT`).
- **Services (`financial-service.ts`, `financial-category-service.ts`):**
  - Implementam regras de negócio de checkout, parcelamento e despesas recorrentes (D-04).
  - Coordenação de atualização de parcelas em lote com `scope: 'ALL'` (D-03).
  - Regra de proteção contábil (D-06): impede exclusão de receitas originadas de agendamentos concluídos ativos.
  - Cálculo de métricas consolidadas em regime de caixa (D-07).
- **Repositories (`financial-repository.ts`, `financial-category-repository.ts`):**
  - Execução de queries SQL parametrizadas isoladas por `tenant_id`.
  - Auto-seed sob demanda de categorias padrão (D-05).
  - Operações atômicas de soft-delete contábil (`is_active = false, deleted_at = CURRENT_TIMESTAMP`).

## 3. Regras de Negócio e Decisões (/grill-me)
1. **Edição de Parcelas com Escopo Global (D-03):**
   - Ao editar uma parcela com `scope: 'ALL'`, apenas as parcelas **PENDENTES** subsequentes daquele `group_id` são atualizadas. Parcelas já pagas (`PAID`) têm sua integridade contábil e histórico preservados inalterados.
2. **Despesas Recorrentes e Parceladas (D-04):**
   - Na criação de despesas com múltiplas parcelas ou recorrência mensal, o usuário define o status da 1ª parcela (`PAID` ou `PENDING`). Todas as parcelas subsequentes nascem obrigatoriamente com status `PENDING` e datas de vencimento mensais sequenciais.
3. **Categorias Customizadas por Tenant (D-05):**
   - Cada consultório possui seu próprio conjunto de categorias (`financial_categories`), permitindo criar, renomear e inativar categorias sem impactar outros consultórios. Caso o tenant não possua categorias cadastradas, o sistema executa um auto-seed automático inicial com as categorias padrão da clínica odontológica.
4. **Proteção Contábil de Receitas Concluídas (D-06):**
   - Não é permitida a exclusão manual de uma transação de receita vinculada a um agendamento que esteja com status `COMPLETED` e ativo (`deleted_at IS NULL`). O endpoint recusa com HTTP 400 e `{ code: 'LINKED_COMPLETED_APPOINTMENT' }`. Para estornar a receita, o operador deve cancelar ou excluir o agendamento (acionando a regra D-09).
5. **Métricas Analíticas em Regime de Caixa (D-07):**
   - O dashboard e endpoint `GET /api/financial/metrics` consolida os indicadores em Regime de Caixa:
     - **Faturamento Realizado (`income_paid_cents`):** soma de receitas com status `PAID` considerando `payment_date`.
     - **Contas a Receber (`income_pending_cents`):** soma de receitas com status `PENDING` considerando `due_date`.
     - **Despesas Pagas (`expenses_paid_cents`):** soma de despesas com status `PAID` considerando `payment_date`.
     - **Despesas a Pagar (`expenses_pending_cents`):** soma de despesas com status `PENDING` considerando `due_date`.
     - **Lucro Líquido Realizado (`net_profit_cents`):** `income_paid_cents - expenses_paid_cents`.
   - Filtros suportados: `today`, `this_month`, `last_30_days`, `all` ou datas customizadas via query params `startDate` e `endDate`.

## 4. Sincronização Offline-First e Estorno de Lançamentos
1. **Tipagem Estrita PostgreSQL em Soft-Delete (`/api/sync/batch`):**
   - Na ingestão de mutações de exclusão lógica (`operation: 'DELETE'` ou `is_active: false`), o timestamp de exclusão e atualização utiliza cast explícito `COALESCE($3::timestamptz, $4::timestamptz)` para evitar erros de tipagem estrita (`42804 datatype_mismatch text vs timestamptz`).
2. **Atualização Parcial de Lançamentos:**
   - Em operações de quitação ou estorno de pagamento (`status: 'PENDING', payment_date: null`), o endpoint preserva campos não informados no payload (`amount_cents`, `category`, `due_date`), e permite a anulação explícita de `payment_date` através de verificação booleana (`CASE WHEN $11::boolean THEN $12::date ELSE payment_date END`).
3. **Consistência Bidirecional com IndexedDB:**
   - Registros com `is_active: false` sincronizados para o cliente são preservados com a flag desativada, garantindo que o `useLiveQuery` e telas filtrem lançamentos estornados mesmo após logout e novo login.
